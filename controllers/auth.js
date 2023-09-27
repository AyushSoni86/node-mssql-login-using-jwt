const sql = require("mssql");
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
// const { pool } = require("../app")

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

const pool = new sql.ConnectionPool(config);
pool.connect()
  .then(() => {
    console.log('Connected to MSSQL database');
  })
  .catch((err) => {
    console.error('Error connecting to MSSQL database:', err);
  });

const JWT_SECRET = "Hello-world";
const JWT_EXPIRES_IN = 10000;
const JWT_COOKIE_EXPIRES_IN = 10000;

exports.login = async (req, res) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return res.status(400).render("login", {
            message: 'Please provide email and password'
        });
    }

    try {
        const poolRequest = pool.request();
        const result = await poolRequest.input('email', email).query(
            "SELECT id, email, password FROM users WHERE email = @email"
        );

        if (result.recordset.length === 0) {
            return res.status(401).render("login", {
                message: 'Incorrect email or password'
            });
        }

        const storedPassword = result.recordset[0].password;

        // Compare the entered password with the stored hashed password
        const passwordMatch = await bcrypt.compare(password, storedPassword);

        if (!passwordMatch) {
            return res.status(401).render("login", {
                message: 'Incorrect email or password'
            });
        }

        // 3) If everything is okay, send a token to the client
        const id = result.recordset[0].id;
        const token = jwt.sign({ id }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });

        const cookieOptions = {
            expires: new Date(
                Date.now() + JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
            ),
            httpOnly: true
        };

        res.cookie('jwt', token, cookieOptions);

        res.status(200).redirect("/");
    } catch (error) {
        console.error(error);
        return res.status(500).render("login", {
            message: "An error occurred while logging in."
        });
    }
};

exports.register = async (req, res) => {
    console.log(req.body);
    const { name, email, password, confirm_password } = req.body;

    try {
        const poolRequest = pool.request();
        const checkEmailResult = await poolRequest.input('email', email).query(
            "SELECT email FROM users WHERE email = @email"
        );

        if (checkEmailResult.recordset.length > 0) {
            return res.render('register', {
                message: 'That Email has been taken'
            });
        } else if (password !== confirm_password) {
            return res.render('register', {
                message: 'Passwords do not match'
            });
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        const insertQuery = `
            INSERT INTO users (name, email, password)
            VALUES (@name, @email, @password)
        `;

        const insertResult = await poolRequest
            .input('name', name)
            .input('password', hashedPassword)
            .query(insertQuery);

        // Redirect to login page after successful registration
        res.status(201).redirect("/login");
    } catch (error) {
        console.error(error);
        return res.status(500).render("register", {
            message: "An error occurred while registering the user."
        });
    }
};

exports.isLoggedIn = async (req, res, next) => {
    console.log(req.cookies);
    if (req.cookies.jwt) {
        try {
            // 1) Verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                JWT_SECRET
            );

            console.log("decoded");
            console.log(decoded);

            // 2) Check if user still exists
            const poolRequest = pool.request();
            const result = await poolRequest.input('id', decoded.id).query(
                'SELECT * FROM users WHERE id = @id'
            );

            console.log(result);

            if (!result.recordset.length) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            console.log("Still logged in");
            req.user = result.recordset[0];
            console.log("next");
            return next();
        } catch (err) {
            return next();
        }
    } else {
        next();
    }
};

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).redirect("/");
};

