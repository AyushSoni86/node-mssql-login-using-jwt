const sql = require("mssql");
const bcrypt = require("bcryptjs")

exports.register = (req, res) => {
    console.log("I am form data register", req.body);
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirm_password = req.body.confirm_password;

    const request = new sql.Request();

    request.input('email', sql.VarChar, email);

    request.query('SELECT email FROM users WHERE email = @email', async (error, result) => {

        if (error) console.log(error);

        if (result.recordset.length > 0) {
            return res.render('register', {
                message: "This email is already in use"
            })
        } 
        else if (password !== confirm_password) {
            return res.render('register', {
                message: "Passwords do not match"
            })
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        const insertQuery = `
            INSERT INTO users (name, email, password)
            VALUES (@name, @email, @password)
        `;

        request.input('name', sql.VarChar, name);
        request.input('password', sql.VarChar, hashedPassword);

        request.query(insertQuery, (insertError, insertResult) => {
            if (insertError) {
                console.log(insertError);
                return res.render('register', {
                    message: "An error occurred while registering the user."
                });
            }

            // User successfully registered
            return res.render('login', {
                message: "Registration successful. You can now log in."
            });
        });
    });


    // res.send("Form submitted");


}


exports.login = async (req, res) => {

    console.log("I am form data login", req.body);

    const email = req.body.email;

    const password = req.body.password;

    console.log(email, password);

    const request = new sql.Request();
    request.input("email", sql.VarChar, email);

    try {
        const result = await request.query(
            "SELECT email, password FROM users WHERE email = @email"
        );

        if (result.recordset.length === 0) {
            return res.render("login", {
                message: "User not found. Please register or check your credentials.",
            });
        }

        const storedPassword = result.recordset[0].password;

        // Compare the entered password with the stored hashed password
        const passwordMatch = await bcrypt.compare(password, storedPassword);

        if (!passwordMatch) {
            return res.render("login", {
                message: "Incorrect password. Please try again.",
            });
        }

        // Successful login
        res.render("dashboard", { message: "Login successful!" });
    } catch (error) {
        console.error(error);
        return res.render("login", {
            message: "An error occurred while logging in.",
        });
    }

    // res.send("logged in submitted");
};




