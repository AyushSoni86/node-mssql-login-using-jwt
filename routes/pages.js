const express = require("express");
const authController = require('../controllers/auth');


const router = express.Router();

router.get('/', authController.isLoggedIn, (req, res) => {
  res.render('index', {
    user: req.user,
    initials: (req.user !== undefined) ? req.user.name.substring(0, 2).toUpperCase() : ""
  });
});

router.get('/profile', authController.isLoggedIn, (req, res) => {
  if (req.user) {
    res.render('profile', {
      user: req.user,
      role: req.user.role,
      initials: req.user.name.substring(0, 2).toUpperCase()
    });
  } else {
    res.redirect("/login");
  }
});

router.get('/login', authController.isLoggedIn, (req, res) => {
  if (req.user) {
    res.render('profile', {
      user: req.user,
      role: req.user.role,
      initials: req.user.name.substring(0, 2).toUpperCase()
    });
  } else {
    res.render("login");
  }
});

router.get('/register', authController.isLoggedIn, (req, res) => {
  if (req.user) {
    res.render('profile', {
      user: req.user,
      role: req.user.role,
      initials: req.user.name.substring(0, 2).toUpperCase()
    });
  } else {
    res.render("register");
  }
});



router.get('/admin',authController.isLoggedIn, (req, res)=>{
  if(req.user){
    res.render('admin');
  }else{
    res.render('home');
  }
} )


module.exports = router;