import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import validator from "@middy/validator";
import httpErrorHandler from "@middy/http-error-handler";
import { v4 as uuidv4 } from "uuid";
import { response } from "../../utils/responseSender/index.mjs";
import { logger } from "../../utils/logger/index.mjs";
import { tokenValidator } from "../../validators/tokenValidator/index.mjs";
import { quizSchema } from "../../validators/quizValidator/index.mjs";

const client = new DynamoDBClient({ region: "eu-north-1" });
const docClient = DynamoDBDocumentClient.from(client);

const TableName = process.env.TABLE_NAME;
const JWT_SECRET = process.env.JWT_SECRET_CODE;

const createQuiz = async (event) => {

  let { quizName } = event.body;
  quizName = quizName.toLowerCase();

  const existingQuiz = await docClient.send(
    new QueryCommand({
      TableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": `QUIZ#${quizName}` },
    })
  );

  if (existingQuiz.Items && existingQuiz.Items.length > 0) {
    return response(400, false, `Quiz "${quizName}" already exists`);
  }

  const quizId = uuidv4();

  const quizCreator = event.user;
  if (!quizCreator) {
    return response(403, false, "Unauthorized: no user data found in token");
  }

  const { username, userEmail, userId } = quizCreator;

  try {
    await docClient.send(
      new PutCommand({
        TableName,
        Item: {
          PK: `QUIZ#${quizName}`,
          SK: `QUIZID#${quizId}`,
          type: "quiz",
          quizName,
          quizCreatorName: username,
          quizCreatorEmail: userEmail, 
          quizCreatorId: userId,
          createdAt: new Date().toISOString(), 
        },
      })
    );
  } catch (error) {
    return response(500, false, `Failed to create quiz: ${error.message}`);
  }

  return response(201, true, `Quiz "${quizName}" created successfully`, {
    quizName,
    quizId,
  });
};

export const handler = middy(createQuiz)
  .use(httpJsonBodyParser()) 
  .use(logger()) 
  .use(tokenValidator(JWT_SECRET)) 
  .use(validator({ inputSchema: quizSchema })) 
  .use(httpErrorHandler()); 
