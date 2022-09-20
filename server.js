const fs = require("fs");
const https = require("https")
const express = require("express");
const mysql = require("mysql");

const con = mysql.createConnection(JSON.parse(fs.readFileSync('keys/dbKey.json', 'utf8')));

const credentials = {
    key: fs.readFileSync('keys/key.pem'),
    cert: fs.readFileSync('keys/server.crt')
};

const app = express();
app.use(express.urlencoded({ extended: true }));

const server = https.createServer(credentials, (req, res) => {
    let dataString = '';
    req.on('data', chunk => {
        dataString += chunk;
    });
    req.on('end', () => {
    const data = JSON.parse(dataString);

    console.log(data);
    res.end();
    });
}).listen(8000);
