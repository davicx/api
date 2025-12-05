//const mysql = require('mysql')
const mysql = require('mysql2');


//CONNECTION
//MYSQL 2/
const pool = mysql.createPool({
   connectionLimit: 10,
   host: 'localhost',
   user: 'root',
   password: 'password',
   database: 'shareshare'
})

//Functions: Get Connectionno
function getConnection() {
   return pool;
}


module.exports = { getConnection };
