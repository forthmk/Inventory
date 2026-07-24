
const fp = require("fastify-plugin");

const db = require("../utils/db")
const { default: fastify } = require("fastify");

module.exports = fp(async (fastify) =>{
    fastify.decorate("db",db)
})