const express = require("express");

const sql = require("mssql");

const path = require("path");

const app = express();

const cookieParser = require('cookie-parser');

const config = {
  user: 'ayush',
  password: 'root',
  server: 'localhost',
  database: 'nodejs-login',
  options: {
    trustedconnection: true,
    enableArithAbort: true,
    trustServerCertificate: true,
  },
  port: 1433
};

const publicDirectory = path.join(__dirname, './public')

app.use(cookieParser());

app.use(express.static(publicDirectory));

app.use(express.urlencoded({ extended: false }));

app.use(express.json());

// app.engine('hbs', exphbs({ extname: '.hbs' }));

app.set('view engine', 'hbs');

const pool = new sql.ConnectionPool(config);

pool.connect()
  .then(() => {
    console.log('Connected to MSSQL database');
  })
  .catch((err) => {
    console.error('Error connecting to MSSQL database:', err);
  });

app.use('/', require('./routes/pages'));

app.use('/auth', require('./routes/auth'));

app.listen(5000, () => {
  console.log("Server started on 5000 port");
});

module.exports.pool = { pool };