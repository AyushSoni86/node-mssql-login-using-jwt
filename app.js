const express = require("express");
const path = require("path");
const app = express();
const cookieParser = require('cookie-parser');
const publicDirectory = path.join(__dirname, './public')


app.use(cookieParser());
app.use(express.static(publicDirectory));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// app.engine('hbs', exphbs({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

app.listen(5000, () => {
  console.log("Server started on 5000 port");
});
