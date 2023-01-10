const router = require('express').Router()
const Database = require("./database-connection");
const bcrypt = require('bcryptjs');
const db = new Database();
const stripe  = require('stripe')('sk_test_51MNGNiSHILw5DZVqV7DIzBcNANZ3Wv815IngtHvRSMjyO8L5VY0rXEVBSlT7dUlNjefbCCnPHQuWX8NUkhRwgnVA00ctY2cvXW');
const axios = require('axios');
const { response } = require('express');

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


router.route("/signup").post((req, res)=> {
    const {username, password, name} = req.body;
    console.log(username)
    const saltRounds = 10;
    const connection = db.connect();
    bcrypt.hash(password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        if(err){
            console.log(err);
        }
        const query = `insert into passenger(username, password, name) values ('${username}', '${hash}', '${name}');`;
        connection.query(query, (error, results, fields) => {
            if(error) {
                console.log(error)
                res.send("error");
            }
            else{
                console.log(results)
                connection.query(`select vehicle_id from vehicle`, (error1, results2, fields3) =>{
                    if(error1){
                        console.log('unable to update')
                    }
                    else{
                        for(let i = 0; i < results2.length; i++){
                            connection.query(`insert into distance values ('${username}', ${results2[i].vehicle_id}, NULL)`);
                        }
                    }
                })
                res.status(200).send("OKAY")
            }
        })
    });
    //connection.disconnect()
})

router.route("/signin").post((req, res) => {
    const {username, password, lat, long} = req.body;
    console.log(username)

    const connection = db.connect();
    const query = `select * from passenger where username ='${username}';`;
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
                    res.send(results)
                    const latS = lat.toString()
                    const longS = long.toString()
                    const loc = latS + ',' + longS
                    let q = `update passenger set passenger_loc = '${loc}' where username = '${username}'`;
                    connection.query(q, (error, results, fields) => {
                        if(error){
                            console.log(error)
                            res.status(500).send("Server error");
                        }
                        else{
                            connection.query(`select vehicle_id, vehicle_loc  from vehicle;`, (err1, res1, feild1) => {
                                if(err1){
                                    console.log(err1)
                                }
                                else{
   
                                    console.log(res1)
                                    let string  = `https://apis.mapmyindia.com/advancedmaps/v1/3d3605631a79f428ea7c80ef7611d74e/distance_matrix/driving/${long},${lat}`;
                                    let newstr = '';
                                    for(let i = 0; i < res1.length; i++){
                                        let splitstr = res1[i].vehicle_loc.split(',')
                                        newstr = newstr + ';' + splitstr[1] + ',' + splitstr[0];
                                    }
                                    console.log(newstr)
                                    //let strings = `https://apis.mapmyindia.com/advancedmaps/v1/3d3605631a79f428ea7c80ef7611d74e/distance_matrix_eta/driving/${lat}%2C${long}%3B12.967622%2C77.714725`
                                    string = string + newstr;
             
                                    // axios.get(string).then((response) => {
                                    //     console.log(response.data)
                                    //     console.log(response.data.results.distances[0])
                                    //     console.log(res1)
                                    //     console.log(response.data.results.distances[0].length)
                                    //     console.log(res1.length)
                                    //     let n = response.data.results.distances[0].length;
                                    //     for(let i = 1; i < n; i++){
                                    //         let dist = response.data.results.distances[0][i]/1000
                                    //         connection.query(`update distance set dist = ${dist} where username = '${username}' and vehicle_id = ${res1[i-1].vehicle_id}`);
                                    //     }
                                    // }).catch((err) => console.log(err))
                                }
                            })
                        }
                    })
                } else {
                    res.status(401).send('invalid credentials')
                }
            } else {
                res.status(401).send("User not found")
            }
        }
    })
    // console.log(connection)
    // connection.disconnect()
})

router.route("/dashboard/ridehistory").post((req, res)=> {
    const connection = db.connect();
    const {username} = req.body;
    console.log(username)
        const query = `select * from history where username = '${username}';`;
        connection.query(query, (error, results, fields) => {
            if(error) {
                console.log(error)
                res.status(500).send("Server error");
            }
            else{
                console.log('results are :')
                console.log(results)
                res.send(results)
            }
        })

        // connection.disconnect()

})

router.route('/updateloc').post((req, res) => {
    const connection = db.connect();
    const {username,loc} = req.body;
    console.log(username, loc)
    // const latS = lat.toString()
    // const longS = long.toString()
    //const loc = latS + ',' + longS
    let query = `update passenger set passenger_loc = '${loc}' where username = '${username}'`;
    connection.query(query, (error, results, fields) => {
        if(error){
            console.log(error)
            res.status(500).send("Server error");
        }
        else{
            console.log(results)
            connection.query(`select vehicle_id, vehicle_loc  from vehicle;`, (err1, res1, feild1) => {
                        if(err1){
                            console.log(err1)
                        }
                        else{
   
                            console.log(res1)
                            let string  = `https://apis.mapmyindia.com/advancedmaps/v1/3d3605631a79f428ea7c80ef7611d74e/distance_matrix/driving/${loc}`;
                            let newstr = '';
                            for(let i = 0; i < res1.length; i++){
                                let splitstr = res1[i].vehicle_loc.split(',')
                                newstr = newstr + ';' + splitstr[1] + ',' + splitstr[0];
                            }
                            console.log(newstr)
                            //let strings = `https://apis.mapmyindia.com/advancedmaps/v1/3d3605631a79f428ea7c80ef7611d74e/distance_matrix_eta/driving/${lat}%2C${long}%3B12.967622%2C77.714725`
                            string = string + newstr;
                            console.log(string)
                            // axios.get(string).then((response) => {
                            //     console.log(response.data)
                            //     console.log(response.data.results.distances[0])
                            //     console.log(res1)
                            //     console.log(response.data.results.distances[0].length)
                            //     console.log(res1.length)
                            //     let n = response.data.results.distances[0].length;
                            //     for(let i = 1; i < n; i++){
                            //         let dist = response.data.results.distances[0][i]/1000
                            //         connection.query(`update distance set dist = ${dist} where username = '${username}' and vehicle_id = ${res1[i-1].vehicle_id}`);
                            //     }
                            // }).catch((err) => console.log("error"))
                        }
                    })
            res.send('updated loc');
        }
    })


})

router.route('/vehicleloc').get((req, res) => {
    const connection = db.connect();
    const query = `select vehicle_loc from vehicle`
    connection.query(query, (error, results, fields) => {
        if(error){
            console.log(error)
            res.status(500).send('Server Error');
        }
        else{
            console.log(results);
            res.send(results)
        }
    })
})

router.route('/getride').post((req, res) => {
    const connection = db.connect();
    
    const {username, model} = req.body
    console.log(username)
    console.log(model)
    let query
    if(model === 'ANY'){
        query = `select d.vehicle_id from distance d, vehicle v where d.vehicle_id = v.vehicle_id and d.username = '${username}' and d.dist < 30.0 and d.vehicle_id not in(select vehicle_id from session)`
    }
    else{
        query = `select d.vehicle_id from distance d, vehicle v where d.vehicle_id = v.vehicle_id and d.username = '${username}' and d.dist < 30.0 and v.model = '${model}' and d.vehicle_id not in(select vehicle_id from session)`
    }
    connection.query(query, (error, results, fields) =>{
        
        if(error){
            console.log(error)
            res.status(500).send('Internal Server Error Yahi se')
        }
        else{
            console.log(results)
            res.status(200).send(results)
        }
    })
})

router.route('/confirmride').post((req, res) => {
    const connection = db.connect()
    const {data, username} = req.body
    const {source, model, dest, vehicle, price, lat_long} = JSON.parse(data);
    const query = `insert into session (vehicle_id, username, source_loc, destination_loc, cost) values(${vehicle}, '${username}', '${lat_long}', '${dest}', ${price})` ;
    connection.query(query, (error, results, fields) => {
        if(error){
            console.log(error)
            res.status(500).send('Internal Server Error')
        }
        else{
            console.log(results)
            res.send('Inserted into session');
        }
    })
})

router.route('/getsession').post((req, res) => {
    const connection = db.connect()
    const {username} = req.body
    const query = `select * from session where username = '${username}';`
    connection.query(query, (error, results, fields) => {
        if(error){
            console.log(error)
            res.status(500).send('Internal Server Error')
        }
        else{
            console.log(results)
            if(results.length > 0){
                res.status(200).send('true')
            }
            else{
                res.status(200).send('false')
            }
        }
    })
})

router.route("/create-checkout").post(async(req, res) => {
    const {price, qty} = req.body
    const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
       price_data :{
        unit_amount:price,
        currency:'inr',
        product_data:{
            name:'Test',
            description: 'test'
        }
       },
        quantity: qty,
      },
    ],
    mode: 'payment',
    success_url: `http://localhost:3000/booking/success`,
    cancel_url: `http://localhost:3000/booking/faliure`,
  });
  res.send(session.url);

})

router.route('/rideend').post((req, res) => {
    const connection = db.connect()
    const {username} = req.body
    const query = `insert into history(vehicle_id, username, source_loc, destination_loc, cost) (select vehicle_id, username, source_loc, destination_loc, cost from session where username = '${username}')`
    connection.query(query, (error, results, fields) => {
        if (error){
            console.log(error)
            res.status(500).send('Internal Server Error')
        }
        else{
            console.log(results)
            //res.send('session from history completed');
            let q = `delete from session where username = '${username}'`
            connection.query(q, (error, results, fields) => {
                if(error){
                    console.log(error)
                    res.status(500).send('Internal Server Error')
                }
                else{
                    res.send(`deleted ${username}'s session`)
                }
            })
        }
    })
})

router.route('/updatelocsearch').post((req, res) => {
    const connection = db.connect();
    const {eloc, username} = req.body;
    const latS = lat.toString()
    const longS = long.toString()
    const loc = latS + ',' + longS
    let query = `update passenger set passenger_loc = '${eloc}' where username = '${username}'`;
    connection.query(query, (error, results, fields) => {
        if(error){
            console.log(error)
            res.status(500).send("Server error");
        }
        else{
            connection.query(`select * from distance where username = '${username}'`, (error, results, fields) => {
                if(error){
                    console.log('error updating dist')
                }
                else{
                    if(results.length > 0){
                        
                    }
                    else{

                    }
                }
            })
            console.log(results)
            res.send('updated loc');
        }
    })


})

module.exports = router