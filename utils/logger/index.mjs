export const logger = () => ({
  before: async (handler) => {
    console.log(">>> BEFORE:", handler.event.body);
  },
  after: async (handler) => {
    console.log("<<< AFTER:", handler.response);
  },
  onError: async (handler) => {
    console.error("xxx ERROR:", handler.error?.message || "Unknown error");
  }
});
