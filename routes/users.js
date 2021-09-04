const express = require("express");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const passport = require("passport");
const session = require("express-session");

const router = express.Router();
const User = require("../models/newUser");
require("../config/passport")(passport);

// Stroing the session for the user
router.use(
  session({
    secret: process.env.secret,
    saveUninitialized: true,
    resave: true,
  })
);

// Passport middleware
router.use(passport.initialize());
router.use(passport.session());

//login register get requests here
router.get("/login", (req, res) => {
  res.render("login", {
    title: "Login Page",
  });
});

router.get("/register", (req, res) => {
  res.render("register", {
    title: "Register Page",
  });
});

//login register Post Requests here
router.post("/register", (req, res) => {
  const { name, email, password, role } = req.body;
  let errors = [];
  // console.log(req.body);
  if (!name || !email || !password || !role) {
    errors.push({ msg: "Please fill all the required feilds!" });
  }
  if (errors.length > 0) {
    res.render("register", {
      errors,
      name,
      email,
      password,
      role,
    });
  } else {
    User.findOne({ email: email }).then((user) => {
      if (user) {
        //user exsists in database
        errors.push({ msg: "Email is already registered" });
        res.render("register", {
          errors,
          name,
          email,
          password,
          role,
        });
      } else {
        const newUser = new User({
          name,
          email,
          password,
          role,
        });
        //hash the Password
        bcrypt.genSalt(10, (err, salt) =>
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then((user) => {
                var userrole = _.lowerCase(newUser.role);
                if (userrole === "admin") {
                  res.render("admin");
                } else {
                  res.render("client");
                }
              })
              .catch((err) => console.log(err));
          })
        );
      }
    });
  }
});

router.post("/login", (req, res, next) => {
  // console.log(req.body);
  User.findOne({ email: req.body.email }, (err, loggedinUser) => {
    // console.log(loggedinUser);
    var role = _.lowerCase(loggedinUser.role);
    // console.log(role);
    if (role === "admin") {
      passport.authenticate("local", {
        successRedirect: "/admin",
        failureRedirect: "/unauthorized",
      })(req, res, next);
    } else {
      passport.authenticate("local", {
        successRedirect: "/client",
        failureRedirect: "/unauthorized",
      })(req, res, next);
    }
  });
});

module.exports = router;
