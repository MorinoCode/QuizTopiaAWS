import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { response } from "../../utils/responseSender/index.mjs";
import { logger } from "../../utils/logger/index.mjs";
import { tokenValidator } from "../../validators/tokenValidator/index.mjs";

const client = new DynamoDBClient({ region: "eu-north-1" });
const docClient = DynamoDBDocumentClient.from(client);

const TableName = process.env.TABLE_NAME;
const JWT_SECRET = process.env.JWT_SECRET_CODE;

const getUserQuiz = async (event) => {
  const { userId, quizId } = event.pathParameters;

  if (!userId || !quizId) {
    return response(400, false, "userId and quizId are required");
  }

  const quizResult = await docClient.send(
    new QueryCommand({
      TableName,
      IndexName: "QuizCreatorIdIndex",
      KeyConditionExpression: "quizCreatorId = :uid",
      ExpressionAttributeValues: {
        ":uid": userId,
      },
    })
  );

  const quizzes = quizResult.Items;

  const quiz = quizzes.find((q) => q.SK === `QUIZID#${quizId}`);

  if (!quiz) {
    return response(404, false, "Quiz not found for this user");
  }

  const questionsResult = await docClient.send(
    new QueryCommand({
      TableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": `QUESTION#${quiz.quizName}`,
        ":skPrefix": "QUESTIONID#",
      },
    })
  );

   
  const filteredQuestions = (questionsResult.Items || []).map((q) => ({
    question: q.question,
    answer: q.answer,
    questionCreatorName: q.questionCreatorName,
    location: q.location,
  }));

  const filteredQuiz = {
    quizName: quiz.quizName,
    quizCreatorName: quiz.quizCreatorName,
    questions: filteredQuestions,
  };

  return response(200, true, "Quiz with questions", filteredQuiz);
};


export const handler = middy(getUserQuiz)
  .use(tokenValidator(JWT_SECRET))
  .use(logger())
  .use(httpErrorHandler());
