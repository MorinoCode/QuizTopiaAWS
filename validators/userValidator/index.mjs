export const userSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        username: { type: "string", minLength: 5 },
        email: { type: "string", format: "email" },
        password: {
          type: "string",
          minLength: 5,
          pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).+$",
        },
      },
      required: ["password"],
      anyOf: [{ required: ["username"] }, { required: ["email"] }],
    },
  },
};
