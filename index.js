const fs = require("fs");
const https = require("https");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const database = mysql.createConnection(JSON.parse(fs.readFileSync('keys/dbKey.json', 'utf8')));

const jwtSecret = fs.readFileSync('keys/jwtSecret.key').toString();
const credentials = {
    key: fs.readFileSync('keys/key.pem'),
    cert: fs.readFileSync('keys/server.crt')
};

https.createServer(credentials ,(request, response) => {
    request.on("error", () => {
        response.writeHead(400);
        response.end();
    });

    request.on("data", (chunk) => {
        const data = JSON.parse(chunk);
        console.log();
        console.log("Recived request for " + request.url);
        console.log(data);

        switch(request.url){
            case "/account/create":
                createAccount(data, response)
                break;
            case "/account/login":
                login(data, response);
                break;
        }
    });
}).listen(8000);

console.log("Server now listening to 8000 ...");

/*
 * Server Functions
 */
function createAccount(data, response){
    const passwordHash = bcrypt.hashSync(data.password, 10);

    const dublicateTestQuerry = "SELECT * FROM logindata WHERE  username='" + data.username + "'";
    database.query(dublicateTestQuerry, (err, result) => 
    {
        if (err) throw err;
        if(result.length > 0){
            console.log("Account already exsists");
            response.writeHead(409);
            response.end();
        }
        else{
            const insertionQuerry = "INSERT INTO logindata(username, password) VALUES('" + data.username + "', '" + passwordHash + "')"
            database.query(insertionQuerry, (err, result) => {if (err) throw err;});
  
            console.log("Created new account for " + data.username);
            response.writeHead(201);
            response.end();
        }
    })
}

function login(data, response){
    const passwordQuerry = "SELECT password FROM logindata WHERE  username='" + data.username + "'";
    database.query(passwordQuerry, (err, result) => {
        if (err) throw err;

        if(result.length == 0){
            console.log("Login failed: Account " + data.username + " does not exist");
            response.writeHead(401);
            response.end();
        }
        else{
            const passwordHash = result[0].password.toString();
            const status = bcrypt.compareSync(data.password, passwordHash);
            if(status){
                console.log("Login succsesfull");

                const payload = {
                    username: data.username
                }
                
                const token = jwt.sign(payload, jwtSecret)

                response.writeHead(200, {
                    'Content-Lenght': Buffer.byteLength(token.toString()),
                    'Content-Type': 'text/plain'
                })
                response.end(token.toString());
            }
            else{
                console.log("Login failed: Wrong Password");
                response.writeHead(401);
                response.end();
            }
        }
    });
}