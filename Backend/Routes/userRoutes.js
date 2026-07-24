const {
  createUser,
  getAllUsers,
  getUserById,
  updateProfileImage,
  updateUser,
  deleteUser,
} = require("../Controllers/userControllers");

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
          profileImage: { type: "string", nullable: true }
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
  //get singe user by ID
  fastify.get("/users/:id", getUserById);
  // Update profile image (cloudflare R2 path/url)
fastify.patch("/users/:id/profile-image", updateProfileImage);
//update user details (username, email)
fastify.patch("/users/:id", updateUser);
//delete user 
fastify.deleteUser("/users/:id", deleteUser);
}

module.exports = userRoutes;
