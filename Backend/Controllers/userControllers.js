// Controllers/userControllers.js
const userModel = require("../Models/userModel");

//create new user
async function createUser(request, reply) {
  console.log("1. Request received");
  const { username, email, password, profileImage } = request.body;

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
    users,
  });
}

// Get single user by ID
async function getUserById(request, reply) {
  const { id } = request.params;
  const user = await userModel.findById(id);

  if (!user) {
    return reply.status(404).send({ error: "user not found" });
  }

  //remove password from response for security
  const { password, ...userData } = user;

  return reply.status(200).send({
    message: "Successfully retrieved user data",
    user: userData,
  });
}
//update user profile image (cloudflare r2 URL/key)
async function updateProfileImage(request, reply) {
  const { id } = request.params;
  const { profileImage } = request.body;

  if (!profileImage) {
    return reply.status(400).send({ error: "ProfileImage is required" });
  }
  const existingUser = await userModel.findByEmail(id);
  if (!existingUser) {
    return reply.status(404).send({ error: "User not found" });
  }
  await userModel.updateProfileImage(id, profileImage);
  return reply.status(200).send({
    message: "Profile image updated successfully",
    profileImage,
  });
}
//update function user info(username, email)
async function updateUser(request, reply) {
  const { id } = request.params;
  const { username, email } = request.body;

  const existinguser = await userModel.findById(id);
  if (!existinguser) {
    return reply.status(404).send({ error: "User not found" });
  }

  const updateData = {};
  if (username) updateData.username = username;
  if (email) updateData.email = email;

  if (Object.keys(updateData).lenght === 0) {
    return reply.status(400).send({ error: "No fields to provided to update" });
  }
  await userModel.UpdateUser(id, updateData);

  return reply.status(200).send({
    message: "User updated successfully",
    updatedFields: updateData,
  });
}

//delete user
async function deleteUser(request, reply) {
  const { id } = request.params;

  const existingUser = await userModel.findById(id);
  if (!existingUser) {
    return reply.status(404).send({ error: "User not found" });
  }
  await userModel.deleteUser(id);

  return reply.status(200).send({
    message: "User deleted successfully",
    userId: id,
  });
}

module.exports = {
  createUser,
  getAllUsers,
  //added modules
  getUserById,
  updateProfileImage,
  updateUser,
  deleteUser,
};
