const db = require("../utils/db")

module.exports = {
    //create model para sa create user
  async createUser(username, email, hashedPassword) {
    const result = await db
      .insertInto("users")
      .values({ username, email, password: hashedPassword })
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
      .select(["id", "username", "email", "created_at"])
      .execute();
  }
}