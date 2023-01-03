const Database = require('./database-connection');
const db = new Database();

const connection = db.connect();
console.log(connection);
db.disconnect();