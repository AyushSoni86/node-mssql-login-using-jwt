const express = require("express");
const authController = require('../controllers/auth');


const router = express.Router();

router.get('/', authController.isLoggedIn, (req, res) => {
    console.log("inside");
    console.log(req.user);
    res.render('index', {
      user: req.user,
      initials: (req.user !== undefined)?req.user.name.substring(0, 2).toUpperCase() : ""
    });
  });
  
  router.get('/profile', authController.isLoggedIn, (req, res) => {
    console.log("inside");
    console.log(req.user);
    if(req.user) {
      res.render('profile', {
        user: req.user,
        initials: req.user.name.substring(0, 2).toUpperCase()  
      });
    } else {
      res.redirect("/login");
    }
    
  });
  
  router.get('/login', (req, res) => {
    res.render('login');
  });
  
  router.get('/register', (req, res) => {
    res.render('register');
  });

module.exports = router;