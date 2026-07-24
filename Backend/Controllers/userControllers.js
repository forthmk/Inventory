// Controllers/userControllers.js
const userModel = require("../Models/userModel");

async function createUser(request, reply) {
  console.log("1. Request received");
  const { username, email, password } = request.body;

  if (!username || !email || !password) {
    return reply.status(400).send({ error: "Missing required fields" });
  }

  console.log("2. Checking existing email...");
  const existing = await userModel.findByEmail(email);
  console.log("3. findByEmail done:", existing);

  if (existing) {
    return reply.status(409).send({ error: "Email already registered" });
  }

  console.log("4. Hashing password...");
  const hashedPassword = await request.server.bcrypt.hash(password);
  console.log("5. Password hashed");

  console.log("6. Creating user in DB...");
  const userId = await userModel.createUser(username, email, hashedPassword);
  console.log("7. User created, ID:", userId);

  return reply.status(201).send({
    message: "User created successfully",
    userId,
    username,
    email,
  });
}

async function getAllUsers(request, reply) {
  const users = await userModel.findAllUser();
  return reply.status(200).send({
    message: "Successfully show all the users data",
    users
  });
}

module.exports = { createUser, getAllUsers };