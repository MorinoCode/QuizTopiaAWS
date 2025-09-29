
export const quizSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        quizName: { type: "string", minLength: 3 }, 
      },
      required: ["quizName"], 
    },
  },
  required: ["body"],
};
