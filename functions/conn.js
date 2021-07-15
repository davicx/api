const mysql = require('mysql')

//CONNECTION
/*
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shareshare'
})
*/

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'shareshare.c3itguipg2wt.us-west-2.rds.amazonaws.com',
    user: 'admin',
    password: 'gCtLRbXMWWS2SwNg',
    database: 'shareshare'
})

//Functions: Get Connection
function getConnection() {
    return pool;
}

module.exports = { getConnection };

