require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const routes = require('./routes');
const database = require('./config/database');

const app = express();
const host = process.env.APP_HOST;
const port = process.env.APP_PORT;
const api_version = process.env.API_VERSION;

app.use(cors());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

database();

app.use(``, routes());

app.listen(port, () => {
  console.log(`Server started at ${host}:${port}/`);
});

module.exports = app;
