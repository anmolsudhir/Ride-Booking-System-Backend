const router = require('express').Router()
const Database = require("./database-connection");
const bcrypt = require('bcryptjs');
const db = new Database();

router.route("/signup").post((req, res) => {
    const {username, password} = req.body;
    res.send({username, password}); 
});

router.route("/test").get((req, res)=>{
    const connection = db.connect();
    connection.query("Select * from user", function (err, results, fields) {
        if (err){
            console.log(err);
            res.status(500).send("SAD");
        }
        console.log(results); // results contains rows returned by server
        console.log(fields); // fields contains extra meta data about results, if available
        res.send(results);
    });
    db.disconnect();
});


router.route("/signin").post((req, res)=> {
    const {username, password} = req.body;
    console.log(username)

    const connection = db.connect();
    const query = `select * from user where username ='${username}';`;
    connection.query(query, (error, results, fields) => {

        if(error) {
            console.log(error)
            res.status(500).send("Server error");
        }
        else{
            console.log(results)
           if(results.length > 0){
                const userInfo = results[0];
                const passwordHash = userInfo.password;
                const isPassowrdCorrect = bcrypt.compareSync(password, passwordHash);
                if(isPassowrdCorrect) {
                    res.send("Logged in ")
                } else {
                    res.status(401).send('invalid credentials')
                }
           } else {
                res.status(401).send("User not found")
           }

        }
    })

})


module.exports = router