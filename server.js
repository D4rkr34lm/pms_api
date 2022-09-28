const fs = require("fs");
const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require('body-parser');

const database = mysql.createConnection(JSON.parse(fs.readFileSync('keys/dbKey.json', 'utf8')));

const jwtSecret = fs.readFileSync('keys/jwtSecret.key').toString();

const port = 3001;
const app = express();
app.use(bodyParser.json())

app.get("/account/data", (request, response) =>{
    console.log("Recived request for account data");
    
    jwt.verify(request.headers.authorization, jwtSecret, (err, token) => {
        if(err === null){
            response.status(200).send();
        }
        else{
            response.status(401).send();
        }
    });
});

app.post("/account/login", (request, response) => {
    console.log("Recived login request");
    const data = request.body;
    console.log(data);

    const passwordQuerry = "SELECT password FROM logindata WHERE  username='" + data.username + "'";
    database.query(passwordQuerry, (err, result) => {
        if (err) throw err;

        if(result.length == 0){
            console.log("Login failed: Account " + data.username + " does not exist");
            response.status(401).send();
        }
        else{
            const passwordHash = result[0].password.toString();
            const status = bcrypt.compareSync(data.password, passwordHash);
            if(status){
                console.log("Login succsesfull");

                const payload = {
                    username: data.username
                }
                
                const token = jwt.sign(payload, jwtSecret, {expiresIn: "8h"})

                response.status(200).send(token.toString());
            }
            else{
                console.log("Login failed: Wrong Password");
                response.status(401).send();
            }
        }
    });
});

app.post("/account/create", (request, response) => {
    console.log("Recived account creation request");
    const data = request.body;
    console.log(data);
    const passwordHash = bcrypt.hashSync(data.password, 10);

    const dublicateTestQuerry = "SELECT * FROM logindata WHERE  username='" + data.username + "'";
    database.query(dublicateTestQuerry, (err, result) => 
    {
        if (err) throw err;
        if(result.length > 0){
            console.log("Account already exsists");
            response.status(409).send();
        }
        else{
            const insertionQuerry = "INSERT INTO logindata(username, password) VALUES('" + data.username + "', '" + passwordHash + "')"
            database.query(insertionQuerry, (err, result) => {if (err) throw err;});
  
            console.log("Created new account for " + data.username);
            response.status(201).send();
        }
    })
});

app.listen(port, () => {console.log("Now listening to " + port + " ...")})