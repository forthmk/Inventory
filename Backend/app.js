
require("dotenv").config(); // load .env variables first, bago anything else uses
console.log(process.env.SQLHOST); // test line — remove after confirming it works


const fastify = require("fastify")({logger: true});

fastify.register(require("@fastify/cors"));
fastify.register(require("fastify-bcrypt"), { saltWorkFactor: 10 });
fastify.register(require("@fastify/jwt"), { secret: process.env.JWT_SECRET });
fastify.register(require("./plugins/db"));
fastify.register(require("./routes/userRoutes")); //this is required for our routes

const start = async() => {
    try{
        await fastify.listen({port: process.env.PORT || 3000 , host: "0.0.0.0"})
        console.log(`server running on port ${process.env.PORT || 3000}`)

    }catch(error){
        fastify.log.error(error)
        process.exit(1);

    }
}

start(); //without function its undefined