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

const getAllQuizzes = async () => {
  
  const quizResult = await docClient.send(
    new QueryCommand({
      TableName,
      IndexName: "typeIndex",
      KeyConditionExpression: "#type = :type",
      ExpressionAttributeNames: { "#type": "type" },
      ExpressionAttributeValues: { ":type": "quiz" },
    })
  );

  const quizzes = quizResult.Items;

  if (!quizzes || quizzes.length === 0) {
    return response(400, false, "No quiz found");
  }

  
  const quizzesWithQuestions = await Promise.all(
    quizzes.map(async (quiz) => {
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

      return {
        ...quiz,
        questions: questionsResult.Items || [],
      };
    })
  );

  return response(200, true, "List of all quizzes with questions", quizzesWithQuestions);
};

export const handler = middy(getAllQuizzes)
  .use(tokenValidator(JWT_SECRET))
  .use(logger())
  .use(httpErrorHandler());
