import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import validator from "@middy/validator";
import httpErrorHandler from "@middy/http-error-handler";
import { userSchema } from "../../validators/userValidator/index.mjs";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { response } from "../../utils/responseSender/index.mjs";
import { logger } from "../../utils/logger/index.mjs";

const client = new DynamoDBClient({ region: "eu-north-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TableName = process.env.TABLE_NAME;

const createUser = async (event) => {
  let { username, email, password } = event.body;

  username = username.toLowerCase();
  email = email.toLowerCase();

  const existedUser = await docClient.send(
    new QueryCommand({
      TableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": `USER#${username}` },
    })
  );

  if (existedUser.Items?.length > 0) {
    return response(400, false, `User ${username} already registered`);
  }

  const emailExists = await docClient.send(
    new QueryCommand({
      TableName,
      IndexName: "EmailIndex",
      KeyConditionExpression: "userEmail = :email",
      ExpressionAttributeValues: { ":email": email },
    })
  );

  if (emailExists.Items?.length > 0) {
    return response(400, false, `Email ${email} is already registered`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  const newUser = new PutCommand({
    TableName,
    Item: {
      PK: `USER#${username}`,
      SK: `USERID#${userId}`,
      userId,
      username,
      userEmail: email,
      password: hashedPassword,
    },
  });

  await docClient.send(newUser);

  return response(201, true, "New User Registered", { username });
};

export const handler = middy(createUser)
  .use(httpJsonBodyParser())
  .use(logger())
  .use(validator({ inputSchema: userSchema }))
  .use(httpErrorHandler());
