import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import middy from "@middy/core";
import jsonBodyParser from "@middy/http-json-body-parser";
import { response } from "../../utils/responseSender/index.mjs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { logger } from "../../utils/logger/index.mjs";
import validator from "@middy/validator";
import { userSchema } from "../../validators/userValidator/index.mjs";
import httpErrorHandler from "@middy/http-error-handler";

const TableName = process.env.TABLE_NAME;
const JWT_SECRET = process.env.JWT_SECRET_CODE;

const client = new DynamoDBClient({ region: "eu-north-1" });
const docClient = DynamoDBDocumentClient.from(client);

const userLogin = async (event) => {
  let { username, email, password } = event.body;

  if (!username && !email) {
    return response(400, false, "Provide either username or email");
  }

  let queryParams;
  let user;

  try {
    if (username) {
      username = username.toLowerCase();
      queryParams = {
        TableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": `USER#${username}` },
      };
    } else if (email) {
      email = email.toLowerCase();
      queryParams = {
        TableName,
        IndexName: "EmailIndex",
        KeyConditionExpression: "#ue = :email",
        ExpressionAttributeNames: { "#ue": "userEmail" },
        ExpressionAttributeValues: { ":email": email },
      };
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    if (!result.Items || result.Items.length === 0) {
      return response(400, false, "Invalid credentials");
    }

    user = result.Items[0];
  } catch (err) {
    console.error("❌ Login error:", err);
    return response(500, false, "Internal server error");
  }

  const matchedPassword = await bcrypt.compare(password, user.password);
  if (!matchedPassword) {
    return response(400, false, "Invalid credentials");
  }

  const token = jwt.sign(
    { userId: user.userId, username: user.username, userEmail: user.userEmail },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return response(200, true, `Welcome ${user.username}`, { token });
};

export const handler = middy(userLogin)
  .use(jsonBodyParser())
  .use(logger())
  .use(validator({ inputSchema: userSchema }))
  .use(httpErrorHandler());
