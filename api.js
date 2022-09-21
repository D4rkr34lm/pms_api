const fs = require("fs");
const https = require("https");
const mysql = require("mysql");
const bcrypt = require("bcrypt");

const con = mysql.createConnection(JSON.parse(fs.readFileSync('keys/dbKey.json', 'utf8')));

const credentials = {
    key: fs.readFileSync('keys/key.pem'),
    cert: fs.readFileSync('keys/server.crt')
};

const key = fs.readFileSync('keys/apiKey.key').toString();

const server = https.createServer(credentials, (req, res) => {
    let dataString = '';
    req.on('data', chunk => {
        dataString += chunk;
    });
    req.on('end', () => {
    const data = JSON.parse(dataString);
    console.log("Request resived");

    if(data.key !== key){
        console.log("Wrong key");
        res.end();
        return;
    }

    try{
        console.log(data);
        switch(data.type){
            case "createAccount":
                createAccount(data, res);
                break;
            case "login":
                login(data, res);
                break;
        }
    }
    catch(error){
        console.log("Recived faulty request");
    }
    res.end();
    });
}).listen(8000);

async function createAccount(data, res){
    const passwordHash = await bcrypt.hash(data.password, 10);

    const dublicateTestQuerry = "SELECT * FROM logindata WHERE  username='" + data.username + "'";
    con.query(dublicateTestQuerry, (err, result) => 
    {
        if (err) throw err;
        if(result.length > 0){
            console.log("Account already exsists");
            res.write("Account already exsists");
        }
        else{
            const insertionQuerry = "INSERT INTO logindata(username, password) VALUES('" + data.username + "', '" + passwordHash + "')"
            con.query(insertionQuerry, (err, result) => {if (err) throw err;});
  
            console.log("Created new account for " + data.username);
            res.write("Created new account");
        }
    })
}

async function login(data, res){
    const passwordQuerry = "SELECT password FROM logindata WHERE  username='" + data.username + "'";
    con.query(passwordQuerry, (err, result) => {
        if (err) throw err;

        if(result.length == 0){
            console.log("Login failed: Account " + data.username + " does not exist");
            res.write("Login Failed");
        }
        else{
            const passwordHash = result[0].password.toString();
            const status = bcrypt.compareSync(data.password, passwordHash);
            console.log(status);
            if(status){
                console.log("Login succsesfull");
            }
            else{
                console.log("Login failed: Wrong Password");
                res.write("Login failed");
            }
        }
    });
}