const express = require("express");

const sql = require("mssql");

const path = require("path");

const app = express();

var config = {
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

app.use(express.static(publicDirectory));

app.use(express.urlencoded({ extended: false }));

app.use(express.json());

app.set('view engine', 'hbs');

sql.connect(config, function (err) {
    if (err) console.log(err);
    else console.log("Database connected successfully.............")
});

app.use('/', require('./routes/pages'));

app.use('/auth', require('./routes/auth'));

app.listen(5000, () => {
    console.log("Server started on 5000 port");
});