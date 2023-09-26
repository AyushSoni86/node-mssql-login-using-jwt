const sql = require("mssql");
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const JWT_SECRET = "Hello world";
const JWT_EXPIRES_IN = 120;
const JWT_COOKIE_EXPIRES_IN = 100;
// exports.register = (req, res) => {
//     console.log("I am form data register", req.body);
//     const name = req.body.name;
//     const email = req.body.email;
//     const password = req.body.password;
//     const confirm_password = req.body.confirm_password;

//     const request = new sql.Request();

//     request.input('email', sql.VarChar, email);

//     request.query('SELECT email FROM users WHERE email = @email', async (error, result) => {

//         if (error) console.log(error);

//         if (result.recordset.length > 0) {
//             return res.render('register', {
//                 message: "This email is already in use"
//             })
//         } 
//         else if (password !== confirm_password) {
//             return res.render('register', {
//                 message: "Passwords do not match"
//             })
//         }

//         let hashedPassword = await bcrypt.hash(password, 8);
//         console.log(hashedPassword);

//         const insertQuery = `
//             INSERT INTO users (name, email, password)
//             VALUES (@name, @email, @password)
//         `;

//         request.input('name', sql.VarChar, name);
//         request.input('password', sql.VarChar, hashedPassword);

//         request.query(insertQuery, (insertError, insertResult) => {
//             if (insertError) {
//                 console.log(insertError);
//                 return res.render('register', {
//                     message: "An error occurred while registering the user."
//                 });
//             }

//             // User successfully registered
//             return res.render('login', {
//                 message: "Registration successful. You can now log in."
//             });
//         });
//     });


//     // res.send("Form submitted");


// }


// exports.login = async (req, res) => {

//     console.log("I am form data login", req.body);

//     const email = req.body.email;

//     const password = req.body.password;

//     console.log(email, password);

//     const request = new sql.Request();
//     request.input("email", sql.VarChar, email);

//     try {
//         const result = await request.query(
//             "SELECT email, password FROM users WHERE email = @email"
//         );

//         if (result.recordset.length === 0) {
//             return res.render("login", {
//                 message: "User not found. Please register or check your credentials.",
//             });
//         }

//         const storedPassword = result.recordset[0].password;

//         // Compare the entered password with the stored hashed password
//         const passwordMatch = await bcrypt.compare(password, storedPassword);

//         if (!passwordMatch) {
//             return res.render("login", {
//                 message: "Incorrect password. Please try again.",
//             });
//         }

//         // Successful login
//         res.render("profile", { message: "Login successful!" });
//     } catch (error) {
//         console.error(error);
//         return res.render("login", {
//             message: "An error occurred while logging in.",
//         });
//     }

//     // res.send("logged in submitted");
// };

exports.login = async (req, res) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return res.status(400).render("login", {
            message: 'Please provide email and password'
        });
    }

    // 2) Check if user exists && password is correct
    const request = new sql.Request();

    request.input('email', sql.VarChar, email);

    try {
        const result = await request.query(
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
    const { name, email, password, passwordConfirm } = req.body;

    // 2) Check if user exists
    const request = new sql.Request();

    request.input('email', sql.VarChar, email);

    try {
        const result = await request.query(
            "SELECT email FROM users WHERE email = @email"
        );

        if (result.recordset.length > 0) {
            return res.render('register', {
                message: 'That Email has been taken'
            });
        } else if (password !== passwordConfirm) {
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

        request.input('name', sql.VarChar, name);
        request.input('password', sql.VarChar, hashedPassword);

        await request.query(insertQuery);

        // Redirect to login page after successful registration
        res.status(201).redirect("/login");
    } catch (error) {
        console.error(error);
        return res.status(500).render("register", {
            message: "An error occurred while registering the user."
        });
    }
};

// The isLoggedIn and logout functions can remain the same.


exports.isLoggedIn = async (req, res, next) => {
    console.log(req.cookies);
    if (req.cookies.jwt) {
        try {
            // 1) verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                JWT_SECRET
            );

            console.log("decoded");
            console.log(decoded);

            // 2) Check if user still exists
            sql.start.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
                console.log(result)
                if (!result) {
                    return next();
                }
                // THERE IS A LOGGED IN USER
                req.user = result[0];
                // res.locals.user = result[0];
                console.log("next")
                return next();
            });
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

