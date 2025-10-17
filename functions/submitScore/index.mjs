import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import { logger } from "../../utils/logger/index.mjs";
import { tokenValidator } from "../../validators/tokenValidator/index.mjs";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const { TABLE_NAME, JWT_SECRET_CODE } = process.env;

const MAX_SCORE = 100000000;
const inv = (n) => String(MAX_SCORE - n).padStart(9, "0");

const baseHandler = async (event) => {
  try {
    
    const user = event.user;
    const { username, userId } = user;
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    }

    const { quizId, score } = event.body || {};
    if (!quizId || typeof quizId !== "string") {
      return { statusCode: 400, body: JSON.stringify({ message: "quizId required" }) };
    }
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 0) {
      return { statusCode: 400, body: JSON.stringify({ message: "score must be a positive number" }) };
    }

    const now = new Date().toISOString();
    const item = {
      PK: `LEADERBOARD#${quizId}`,
      SK: `S#${inv(numericScore)}#${userId}`,
      type: "LEADERBOARD",
      quizId,
      userId,
      username,
      score: numericScore,
      createdAt: now,
    };

    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "score stored", quizId, score: numericScore }),
    };
  } catch (err) {
    const code = err.name === "JsonWebTokenError" || err.name === "TokenExpiredError" ? 401 : 500;
    return { statusCode: code, body: JSON.stringify({ message: err.message }) };
  }
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser()) 
  .use(logger()) 
  .use(tokenValidator(JWT_SECRET_CODE)) 
  .use(httpErrorHandler()); 
