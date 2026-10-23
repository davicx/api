//const mysql = require('mysql')
const mysql = require('mysql2');


//CONNECTION
//MYSQL 2/
const pool = mysql.createPool({
   connectionLimit: 10,
   host: process.env.DB_HOST,
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   database: process.env.DB_NAME
})

//Functions: Get Connectionno
function getConnection() {
   return pool;
}


module.exports = { getConnection };
