const {createUser, getAllUsers} = require("../Controllers/userControllers")

async function userRoutes(fastify, options) {
  fastify.route({
    method: "POST",
    url: "/users",
    schema: {
      body: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string" },
          email: { type: "string" },
          password: { type: "string" },
        },
      },
      response: {
        201: {
          type: "object",
          properties: {
            message: { type: "string" },
            userId: { type: "number" },
            username: { type: "string" },
            email: { type: "string" },
          },
        },
      },
    },
    handler: createUser,
  });

  fastify.get("/users", getAllUsers);
}

module.exports = userRoutes;