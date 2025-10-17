import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { logger } from "../../utils/logger/index.mjs";
import { tokenValidator } from "../../validators/tokenValidator/index.mjs";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const { TABLE_NAME, JWT_SECRET_CODE } = process.env;
const MAX_SCORE = 100000000;


const scoreFromInv = (sk) => {
  if (typeof sk !== "string") throw new Error("Bad SK format");
  const parts = sk.split("#"); 
  if (parts.length < 3 || parts[0] !== "S") throw new Error("Bad SK format");
  const invVal = Number(parts[1]);
  if (!Number.isFinite(invVal)) throw new Error("Bad SK number");
  return MAX_SCORE - invVal;
};

const parseLimit = (qs) => {
  const raw = qs?.limit;
  if (raw === undefined) return 10;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 10;
  return Math.min(50, Math.max(1, n));
};

const baseHandler = async (event) => {
  const quizId = event.pathParameters?.quizId;
  const limit = parseLimit(event.queryStringParameters);

  if (!quizId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "quizId path param required" }),
    };
  }

  const resp = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": `LEADERBOARD#${quizId}` },
      
      ScanIndexForward: true,
      Limit: limit,
      
    })
  );

  const items = (resp.Items || []).map((i) => ({
    userId: i.userId,
    username: i.username,
    score: scoreFromInv(i.SK),
    createdAt: i.createdAt,
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      quizId,
      leaderboard: items,
      count: items.length,
      
    }),
  };
};

export const handler = middy(baseHandler)
  .use(tokenValidator(JWT_SECRET_CODE))
  .use(logger())
  .use(httpErrorHandler());
