const db = require("../utils/db")

module.exports = {
    //create model para sa create user
  async createUser(username, email, hashedPassword,profileImage = null) {
    const result = await db
      .insertInto("users")
      .values({ username, email, password: hashedPassword, profile_image: profileImage })
      .executeTakeFirstOrThrow()

    return result.insertId;
  },
 //find email kong meron na existing
  async findByEmail(email) {
    return await db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst();
  },

  //hanapen yong mga existing user

  async findAllUser() {
    return await db
      .selectFrom("users")
      .select(["id", "username", "email","profile_image", "created_at"])
      .execute();
  },
  //update user profile image
async updateProfileImage(userId, profileImage) {
  return await db
  .updateTable("users")
  .set({profile_image: profileImage})
  .where("id", "=", userId)
  .executeTakeFirst();
},
async updateUser(id, updateData){
  return await db
  .updateTable("users")
  .set(updateData)
  .where("id", "=", id)
  .executeTakeFirst();
},
//delete user sa database
async deleteUser(id){
  return await db
  .deleteFrom("users")
  .where("id", "=", id)
  .executeTakeFirst();
}
}
