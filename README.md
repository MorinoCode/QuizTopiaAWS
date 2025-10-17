QuizTopia API

A serverless REST API for creating, managing, taking, and ranking quizzes. Built with Node.js, AWS Lambda, DynamoDB, and Serverless Framework.

Table of Contents

Features

Tech Stack

Setup & Deployment

Authentication

API Endpoints

Request & Response Examples

Testing

Notes

Author

Features

User registration and login with email authentication

Create quizzes and add questions

Update quiz questions (new)

Retrieve all quizzes or a specific user's quiz

Submit answers and get a scored result (new)

Leaderboard per quiz (new)

Delete a quiz along with its questions

Serverless architecture with AWS Lambda and DynamoDB

JWT authentication for protected routes

Tech Stack

Node.js 20.x

AWS Lambda

DynamoDB

Serverless Framework

Middy for middleware

JWT for authentication

Setup & Deployment

Clone the repository:

git clone <your-repo-url>
cd serverlessApi


Install dependencies:

npm install


Set environment variables in serverless.yml:

TABLE_NAME: QuizTopiTableFinal
JWT_SECRET_CODE: yourSecretKeyHere


Deploy to AWS:

serverless deploy


After deployment, you will receive a public API URL. Use it to call all endpoints.

Authentication

Include a JWT in the Authorization header for all protected routes:

Authorization: Bearer <your_token_here>


Public (no JWT required): /createUser, /login
Protected (JWT required by default): everything else (/createQuiz, /addQuestion, /updateQuestion, /submitQuiz, /allquizzes, /{userId}/{quizId}, /{quizId} DELETE, /leaderboard (kan göras publik om du vill)).

API Endpoints
Endpoint	Method	Description	Body / Params
/createUser	POST	Create a new user	{ "username": "morteza", "email": "morteza@example.com", "password": "1234" }
/login	POST	Login and get JWT token	{ "email": "morteza@example.com", "password": "1234" }
/createQuiz	POST	Create a new quiz	{ "quizName": "stockholm" }
/addQuestion	POST	Add a question to a quiz	{ "quizName": "stockholm", "question": "Do you like Stockholm?", "answer": "yes" }
/updateQuestion	PUT	Update an existing question’s text and/or answer	{ "quizName": "stockholm", "questionId": "Q123", "question": "New text", "answer": "new answer" } (minst ett av fälten question/answer krävs)
/submitQuiz	POST	Submit answers and get a score	{ "quizId": "abc-123", "responses": [ { "questionId": "Q1", "answer": "yes" } ] }
/allquizzes	GET	Get all quizzes	—
/{userId}/{quizId}	GET	Get a specific quiz and its questions	Path: userId, quizId
/{quizId}	DELETE	Delete a quiz and its questions	Path: quizId
/leaderboard	GET	Get top results (leaderboard) for a quiz	Query: quizId=abc-123 (req), limit=10 (opt, default 10)

Tips: Om du vill att /leaderboard ska vara offentlig läsning, ta bort JWT-kravet från denna handler.

Request & Response Examples
1) Create User

Request

POST /createUser
Content-Type: application/json

{
  "username": "morteza",
  "email": "morteza@example.com",
  "password": "1234"
}


Response

{ "userId": "u1", "username": "morteza", "email": "morteza@example.com" }

2) Login

Request

POST /login
Content-Type: application/json

{
  "email": "morteza@example.com",
  "password": "1234"
}


Response

{ "token": "<jwt>", "expiresIn": 3600 }

3) Create Quiz

Request

POST /createQuiz
Authorization: Bearer <jwt>
Content-Type: application/json

{ "quizName": "stockholm" }


Response

{ "quizId": "abc-123", "quizName": "stockholm", "quizCreatorId": "u1" }

4) Add Question

Request

POST /addQuestion
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "quizName": "stockholm",
  "question": "Do you like Stockholm?",
  "answer": "yes"
}


Response

{
  "questionId": "Q1",
  "quizName": "stockholm",
  "question": "Do you like Stockholm?",
  "answer": "yes"
}

5) Update Question

Request

PUT /updateQuestion
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "quizName": "stockholm",
  "questionId": "Q1",
  "question": "Do you love Stockholm?",
  "answer": "yes"
}


Response

{ "updated": true, "questionId": "Q1" }

6) Submit Quiz

Request

POST /submitQuiz
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "quizId": "abc-123",
  "responses": [
    { "questionId": "Q1", "answer": "yes" },
    { "questionId": "Q2", "answer": "no" }
  ]
}


Response

{
  "quizId": "abc-123",
  "score": 8,
  "total": 10,
  "percentage": 0.8,
  "details": [
    { "questionId": "Q1", "correct": true, "correctAnswer": "yes" },
    { "questionId": "Q2", "correct": false, "correctAnswer": "yes" }
  ],
  "submittedAt": "2025-10-17T09:12:33Z"
}

7) Get All Quizzes

Request

GET /allquizzes
Authorization: Bearer <jwt>


Response

[
  { "quizId": "abc-123", "quizName": "stockholm", "quizCreatorId": "u1" },
  { "quizId": "def-456", "quizName": "gothenburg", "quizCreatorId": "u2" }
]

8) Get One Quiz (with questions)

Request

GET /{userId}/{quizId}
Authorization: Bearer <jwt>


Response

{
  "quizId": "abc-123",
  "quizName": "stockholm",
  "quizCreatorId": "u1",
  "questions": [
    { "questionId": "Q1", "question": "Do you like Stockholm?" },
    { "questionId": "Q2", "question": "Is Gamla Stan in Stockholm?" }
  ]
}

9) Delete Quiz

Request

DELETE /{quizId}
Authorization: Bearer <jwt>


Response

{ "deleted": true, "quizId": "abc-123" }

10) Leaderboard

Request

GET /leaderboard?quizId=abc-123&limit=10
Authorization: Bearer <jwt>   // valfritt om du vill göra publik


Response

{
  "quizId": "abc-123",
  "items": [
    {
      "userId": "u1",
      "username": "morteza",
      "score": 9,
      "total": 10,
      "percentage": 0.9,
      "submittedAt": "2025-10-17T09:12:33Z"
    },
    {
      "userId": "u2",
      "username": "guest42",
      "score": 8,
      "total": 10,
      "percentage": 0.8,
      "submittedAt": "2025-10-16T17:05:01Z"
    }
  ]
}

Testing

Import the Postman / Insomnia config from config/QuizTopia.postman_collection.json to test all endpoints with example requests.

Ensure you set your JWT token in the Authorization header for protected routes.

Notes

DynamoDB table structure and indexes are defined in serverless.yml.

quizCreatorId identifies quizzes created by a user.

Questions are linked via quizName with a partition key pattern like PK = QUESTION#<quizName>.

Stable IDs: Generate and persist a questionId when adding questions (used by /updateQuestion, /submitQuiz).

Leaderboard storage: On /submitQuiz, also write a result row for ranking, e.g.

Option A (single table): PK = LEADERBOARD#<quizId>, SK = <percentage>#<timestamp>#<userId>

Option B (GSI): GSI1PK = LEADERBOARD#<quizId>, GSI1SK = <percentage>#<timestamp>
Sort descending by percentage (and timestamp as tie-breaker). Store username alias for display (undvik e-post i klartext).

Security: Consider rate limiting on /login and input validation on all routes (e.g. ajv for JSON schema).

Idempotency: /addQuestion can return the existing item if the same payload is re-sent with the same questionId (if provided).

Author

Morteza Rasti Jouneghani
