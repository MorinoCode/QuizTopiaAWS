import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { response } from "../../utils/responseSender/index.mjs";
import { logger } from "../../utils/logger/index.mjs";
import { tokenValidator } from "../../validators/tokenValidator/index.mjs";

const client = new DynamoDBClient({ region: "eu-north-1" });
const docClient = DynamoDBDocumentClient.from(client);

const TableName = process.env.TABLE_NAME;
const JWT_SECRET = process.env.JWT_SECRET_CODE;

const deleteQuiz = async (event) => {
  const { quizId } = event.pathParameters;
  const userId = event.user.userId; 

  if (!userId || !quizId) {
    return response(400, false, "userId and quizId are required");
  }

 
  const quizResult = await docClient.send(
    new QueryCommand({
      TableName,
      IndexName: "QuizCreatorIdIndex",
      KeyConditionExpression: "quizCreatorId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    })
  );

  const quiz = quizResult.Items?.find(q => q.SK === `QUIZID#${quizId}`);
  if (!quiz) return response(404, false, "Quiz not found for this user");

  
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

  
  const itemsToDelete = [
    { PK: quiz.PK, SK: quiz.SK },
    ...((questionsResult.Items || []).map(q => ({ PK: q.PK, SK: q.SK })))
  ];

  while (itemsToDelete.length) {
    const batch = itemsToDelete.splice(0, 25);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TableName]: batch.map(item => ({ DeleteRequest: { Key: item } }))
        }
      })
    );
  }

  return response(200, true, "Quiz and its questions deleted successfully");
};

export const handler = middy(deleteQuiz)
  .use(tokenValidator(JWT_SECRET))
  .use(logger())
  .use(httpErrorHandler());
