const express = require("express");
const session = require("express-session");
const fs = require("fs")
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const ContactUser = require("../models/contacts");

// Storing the session of the user
router.use(session({
  secret: process.env.secret,
  saveUninitialized: true,
  resave: true,
}));

// home page
router.get("/", (req, res) => {
  res.send(
    `<h1 style="text-align: center"> Welcome to user-authentication app</h1>`
  );
});

// Other authenticated pages' get requests here
router.get("/admin", ensureAuthenticated, (req, res) => {
  res.render("admin");
});

router.get("/client", ensureAuthenticated, (req, res) => {
  res.render("client");
});

router.get("/contact", ensureAuthenticated, (req, res) => {
  res.render("contact", {
    message: "Please fill your details and message"
  });
});

router.get("/edit", ensureAuthenticated, (req, res) => {
  res.render("edit");
});

router.get("/download", ensureAuthenticated, (req, res) => {
  ContactUser.find({}, (err, users) => {
    if (err) {
      console.log(err);
    } else {
      const data = JSON.stringify(users);
      fs.writeFileSync("users.json", data);
      res.download("users.json");
    }
  });
});

router.get("/data", ensureAuthenticated, (req, res) => {
  ContactUser.find({}, (err, allDetails) => {
    if (err) {
      console.log(err);
    } else {
      res.render("data", {
        details: allDetails,
      });
    }
  });
});

router.post("/edit", (req, res) => {
  var { existingEmail, name, email, password, role } = req.body;
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) throw err;
      password = hash;
    });
  });
  User.updateOne(
    { email: existingEmail },
    {
      $set: {
        name,
        email,
        password,
        role,
      },
    },
    (err, user) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/edit");
      }
    }
  );
});

// contact user post requests
router.post("/contact",  (req, res) => {
  const { fullname, email, city, phone, message } = req.body;
  const newContact = new ContactUser({
    fullname,
    email,
    city,
    phone,
    message,
  });
  newContact.save();
  res.render("contact", {
    message: "Details are saved succesfully"
  });
});

// For unauthorised users
router.get("/unauthorized", (req, res) => {
  res.render("unauthorized");
});

//Logout user
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/users/login");
});

module.exports = router;
