import jwt from "jsonwebtoken";
import { response } from "../../utils/responseSender/index.mjs";

export const tokenValidator = (JWT_SECRET) => {
  return {
    before: async (handler) => {
      const event = handler.event;

      const authHeader =
        event.headers?.authorization || event.headers?.Authorization;

      if (!authHeader) {
        throw response(401, false, "Missing Authorization header");
      }

      const token = authHeader.split(" ")[1];

      try {
        const decoded = jwt.verify(token, JWT_SECRET);

        event.user = decoded;
      } catch (err) {
        throw response(401, false, "Invalid or expired token");
      }
    },
  };
};
