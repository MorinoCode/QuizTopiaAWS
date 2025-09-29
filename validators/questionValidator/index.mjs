export const questionSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      required: ["quizName", "question", "answer", "location"],
      properties: {
        quizName: { type: "string" },
        question: { type: "string" },
        answer: { type: "string" },
        location: {
          type: "object",
          required: ["longitude", "latitude"],
          properties: {
            longitude: { type: "string" },
            latitude: { type: "string" },
          },
        },
      },
    },
  },
};
