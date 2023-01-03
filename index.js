const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const route = require('./routes')
const dotenv = require('dotenv')
dotenv.config()

const PORT = process.env.SERVER_PORT | 7070;
app.use(cors());
app.use(bodyParser.json());
app.use("/api/v1/", route);
app.listen(PORT, () => {
    console.log("Server listening on " + PORT);
});