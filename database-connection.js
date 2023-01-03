const dotenv = require('dotenv')
dotenv.config()
const mysql = require('mysql2')

class DatabaseConnection{
    constructor(){
        this.connection = null;
    }
    connect() {
        try{
            this.connection = mysql.createConnection({
                host : process.env.MYSQL_HOST,
                user : process.env.MYSQL_USERNAME,
                password : process.env.MYSQL_PASSWORD,
                database : process.env.MYSQL_DATABASE,
                port : process.env.MYSQL_PORT
            });

            return this.connection;
        }catch(e){
            console.log(e);
            return null;
        }
    }
    
    disconnect(){
        if(this.connection){
            this.connection.end();
         
        }
    }
}

module.exports = DatabaseConnection;