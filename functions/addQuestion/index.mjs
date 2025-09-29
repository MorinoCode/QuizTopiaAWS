import middy from "@middy/core";
import jsonBodyParser from "@middy/http-json-body-parser";
import { tokenValidator } from "../../validators/tokenValidator/index.mjs";
import { logger } from "../../utils/logger/index.mjs";
import httpErrorHandler from "@middy/http-error-handler";
import { questionSchema } from "../../validators/questionValidator/index.mjs";
import { response } from "../../utils/responseSender/index.mjs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import validator from "@middy/validator";

const client = new DynamoDBClient({ region: "eu-north-1" });
const docClient = DynamoDBDocumentClient.from(client);

const TableName = process.env.TABLE_NAME;
const JWT_SECRET = process.env.JWT_SECRET_CODE;

const addQuestion = async (event) => {
  let { quizName, question, answer, location } = event.body;

  if (!quizName || !question || !answer || !location) {
    return response(400, false, "All fields must be filled up");
  }

  quizName = quizName.toLowerCase();
  question = question.toLowerCase();

  const isQuizExist = await docClient.send(
    new QueryCommand({
      TableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": `QUIZ#${quizName}` },
    })
  );

  if (!isQuizExist.Items || isQuizExist.Items.length === 0) {
    return response(400, false, "Quiz not found");
  }

  const quizOwner = isQuizExist.Items[0];
  const questionCreator = event.user;
  const questionId = uuidv4();

  try {
    await docClient.send(
      new PutCommand({
        TableName,
        Item: {
          PK: `QUESTION#${quizName}`,
          SK: `QUESTIONID#${questionId}`,
          type: "question",
          quizOwnerName: quizOwner.quizCreatorName,
          quizOwnerId: quizOwner.quizCreatorId,
          questionCreatorName: questionCreator.username,
          questionCreatorEmail: questionCreator.userEmail,
          questionCreatorId: questionCreator.userId,
          question,
          answer,
          location,
          createdAt: new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    return response(400, false, error.message);
  }

  return response(
    200,
    true,
    `Question added successfully ${questionCreator.username}`,
    { question, answer, location, createdAt: new Date().toISOString() }
  );
};

export const handler = middy(addQuestion)
  .use(jsonBodyParser())
  .use(logger())
  .use(tokenValidator(JWT_SECRET))
  .use(validator({ inputSchema: questionSchema }))
  .use(httpErrorHandler());
