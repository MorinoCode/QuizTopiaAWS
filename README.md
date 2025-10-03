
# QuizTopia API

A serverless REST API for creating, managing, and taking quizzes. Built with **Node.js**, **AWS Lambda**, **DynamoDB**, and **Serverless Framework**.

## Table of Contents

* [Features](#features)
* [Tech Stack](#tech-stack)
* [Setup & Deployment](#setup--deployment)
* [API Endpoints](#api-endpoints)
* [Testing](#testing)
* [Author](#author)

---

## Features

* User registration and login with email authentication
* Create quizzes and add questions
* Retrieve all quizzes or a specific user's quiz
* Delete a quiz along with its questions
* Serverless architecture with AWS Lambda and DynamoDB
* JWT authentication for protected routes

---

## Tech Stack

* **Node.js 20.x**
* **AWS Lambda**
* **DynamoDB**
* **Serverless Framework**
* **Middy** for middleware
* **JWT** for authentication

---

## Setup & Deployment

1. Clone the repository:

```bash
git clone <your-repo-url>
cd serverlessApi
```

2. Install dependencies:

```bash
npm install
```

3. Set environment variables in `serverless.yml`:

```yaml
TABLE_NAME: QuizTopiTableFinal
JWT_SECRET_CODE: yourSecretKeyHere
```

4. Deploy to AWS:

```bash
serverless deploy
```

5. After deployment, you will receive a **public API URL**. This URL can be used to test all endpoints.

---

## API Endpoints

| Endpoint             | Method | Description                           | Body / Params                                                                        |
| -------------------- | ------ | ------------------------------------- | ------------------------------------------------------------------------------------ |
| `/createUser`        | POST   | Create a new user                     | `{ "username": "morteza", "email": "morteza@example.com", "password": "S1234!" }`      |
| `/login`             | POST   | Login and get JWT token               | `{ "email": "morteza@example.com", "password": "S1234!" }`                             |
| `/createQuiz`        | POST   | Create a new quiz                     | `{ "quizName": "stockholm" }`                                                        |
| `/addQuestion`       | POST   | Add a question to a quiz              | `{ "quizName": "stockholm", "question": "Do you like Stockholm?", "answer": "yes" }` |
| `/allquizzes`        | GET    | Get all quizzes                       | None                                                                                 |
| `/{userId}/{quizId}` | GET    | Get a specific quiz and its questions | Path params: `userId`, `quizId`                                                      |
| `/{quizId}`          | DELETE | Delete a quiz and its questions       | Path param: `quizId`                                                                 |

> All endpoints except `/createUser` and `/login` require **JWT Authorization** in the `Authorization` header:
> `Authorization: Bearer <your_token_here>`

---

## Testing

* Import the **Postman / Insomnia config** from `config/QuizTopia.postman_collection.json` to test all endpoints with example requests.
* Ensure you set your JWT token in the `Authorization` header for protected routes.

---

## Notes

* DynamoDB table structure and indexes are defined in `serverless.yml`.
* `quizCreatorId` is used to identify quizzes created by a user.
* All questions for a quiz are linked via the `quizName` as `PK = QUESTION#<quizName>`.

---

## Author

**Morteza Rasti Jouneghani**
[Github](https://github.com/MorinoCode)


