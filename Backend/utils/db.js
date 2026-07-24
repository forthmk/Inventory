const mysql = require("mysql2"); 
const {Kysely,MysqlDialect} = require("kysely");

//creatr the raw mysql12 pool yourself
const dialect = new MysqlDialect({
    pool: mysql.createPool({
        host: process.env.SQLHOST,
        user: process.env.SQLUSER,
        password: process.env.SQLPASS,
        database: process.env.SQLDBECOMMERCE,  // should matches your .env
        connectionLimit: 10
    }),
});

// Create the Kysely instance, typed with your Database interface
const db = new Kysely({ dialect });

module.exports = db;