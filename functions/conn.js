const mysql = require('mysql')

//CONNECTION
//Windows WAMP
/*
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shareshare'
})
*/

//MAC
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'shareshare'
})

/*
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'shareshare.c3itguipg2wt.us-west-2.rds.amazonaws.com',
    user: 'admin',
    password: 'gCtLRbXMWWS2SwNg',
    database: 'shareshare'
})
*/

//Functions: Get Connectionno
function getConnection() {
    return pool;
}

module.exports = { getConnection };

