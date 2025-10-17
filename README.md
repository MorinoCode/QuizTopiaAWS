# 🧠 QuizTopia API

A **serverless REST API** for creating, managing, taking, and ranking quizzes.  
Built with **Node.js**, **AWS Lambda**, **DynamoDB**, and **Serverless Framework**.

---

## 📚 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup & Deployment](#setup--deployment)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Request & Response Examples](#request--response-examples)
- [Testing](#testing)
- [Notes](#notes)
- [Author](#author)

---

## ✨ Features

- 👤 User registration and login with email authentication  
- 🧩 Create quizzes and add questions  
- 🔁 **Update quiz questions** *(new)*  
- 📋 Retrieve all quizzes or a specific user’s quiz  
- 🧮 **Submit answers and get a scored result** *(new)*  
- 🏆 **Leaderboard per quiz** *(new)*  
- ❌ Delete a quiz along with its questions  
- ⚡ Serverless architecture with AWS Lambda and DynamoDB  
- 🔐 JWT authentication for protected routes  

---

## 🧰 Tech Stack

| Technology | Purpose |
|-------------|----------|
| **Node.js 20.x** | Runtime environment |
| **AWS Lambda** | Serverless compute |
| **DynamoDB** | NoSQL database |
| **Serverless Framework** | Deployment & configuration |
| **Middy** | Middleware engine |
| **JWT** | Authentication |

---

## 🚀 Setup & Deployment

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd serverlessApi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set environment variables in `serverless.yml`**
   ```yaml
   TABLE_NAME: QuizTopiTableFinal
   JWT_SECRET_CODE: yourSecretKeyHere
   ```

4. **Deploy to AWS**
   ```bash
   serverless deploy
   ```

5. After deployment, you’ll receive a **public API URL** — use it to test your endpoints.

---

## 🔐 Authentication

All protected endpoints require a valid JWT token:

```
Authorization: Bearer <your_token_here>
```

**Public (no JWT needed):**
- `/createUser`
- `/login`

**Protected (JWT required):**
- `/createQuiz`
- `/addQuestion`
- `/updateQuestion`
- `/submitQuiz`
- `/allquizzes`
- `/{userId}/{quizId}`
- `/{quizId}` *(DELETE)*
- `/leaderboard` *(optional – can be public)*

---

## 📡 API Endpoints

| Endpoint | Method | Description | Body / Params |
|-----------|--------|--------------|----------------|
| `/createUser` | POST | Create a new user | `{ "username": "morteza", "email": "morteza@example.com", "password": "1234" }` |
| `/login` | POST | Login and get JWT token | `{ "email": "morteza@example.com", "password": "1234" }` |
| `/createQuiz` | POST | Create a new quiz | `{ "quizName": "stockholm" }` |
| `/addQuestion` | POST | Add a question to a quiz | `{ "quizName": "stockholm", "question": "Do you like Stockholm?", "answer": "yes" }` |
| `/updateQuestion` | PUT | Update an existing question | `{ "quizName": "stockholm", "questionId": "Q123", "question": "New text", "answer": "new answer" }` *(minst ett fält krävs)* |
| `/submitQuiz` | POST | Submit answers and get a score | `{ "quizId": "abc-123", "responses": [ { "questionId": "Q1", "answer": "yes" } ] }` |
| `/allquizzes` | GET | Get all quizzes | — |
| `/{userId}/{quizId}` | GET | Get a specific quiz and its questions | Path params: `userId`, `quizId` |
| `/{quizId}` | DELETE | Delete a quiz and its questions | Path param: `quizId` |
| `/leaderboard` | GET | Get top scores for a quiz | Query: `quizId=abc-123` *(req)*, `limit=10` *(opt)* |

> 💡 **Tip:** Make `/leaderboard` public if you want everyone to see top results.

---

## 🧪 Testing

- Import the **Postman / Insomnia collection** from  
  `config/QuizTopia.postman_collection.json`
- Add your JWT token to the `Authorization` header for protected routes.

---

## 🗒️ Notes

- DynamoDB structure and indexes are defined in `serverless.yml`.
- `quizCreatorId` identifies the user who created a quiz.
- Questions are stored with partition key pattern:  
  `PK = QUESTION#<quizName>`
- **Stable IDs:** Each question has a `questionId` used by `/updateQuestion` and `/submitQuiz`.
- **Leaderboard storage:**  
  - **Option A:** `PK = LEADERBOARD#<quizId>`, `SK = <percentage>#<timestamp>#<userId>`  
  - **Option B (GSI):** `GSI1PK = LEADERBOARD#<quizId>`, `GSI1SK = <percentage>#<timestamp>`
  - Sort by `percentage` descending.
- Avoid storing emails in leaderboard results — use `username` instead.
- Add validation and rate-limiting on `/login` and `/addQuestion`.

---

## 👨‍💻 Author

**Morteza Rasti Jouneghani**  
[GitHub Profile](https://github.com/MorinoCode)

---


