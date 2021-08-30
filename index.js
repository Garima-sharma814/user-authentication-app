require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const _ = require("lodash");
const fs = require("fs");

const app = express();

const hostname = "127.0.0.1";

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect("mongodb://localhost:27017/userDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
mongoose.connect(process.env.connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  userRole: String,
});

userSchema.plugin(passportLocalMongoose);

const users = mongoose.model("user", userSchema);

passport.use(users.createStrategy());
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});

// All the get requests here
app.get("/", (req, res) => {
  res.render("login", {
    title: "Login",
    btn: "Login",
    formaction: "/",
    email: "Enter your email (optional)",
    role: "ex. Admin, Client (optional)",
  });
});

app.get("/register", (req, res) => {
  res.render("register", {
    title: "Register",
    btn: "Sign up",
    formaction: "/register",
    email: "Enter your email",
    role: "ex. Admin, Client, Manager",
  });
});

app.get("/home", (req, res) => {
  const user = req.user;
  if (req.isAuthenticated()) {
    res.render("home", {
      title: "Home",
      username: req.user.username,
      btn: "Logout",
      logaction: "/logout",

    });
  } else {
    res.redirect("/");
  }
});

app.get("/unauthorized", (req, res) => {
  res.render("unauthorized", {
    title: "Unauthorized user",
    btn: "Go back",
    logaction: "/home",
  });
});

app.get("/edit", (req,res) =>{
  // console.log(res.locals.user);
  res.render("edit", {
    title: "Edit",
    btn: "Edit",
    formaction: "/edit",
    name: req.user.username,
  })
});

app.get("/download", (req, res) =>{
  users.find({}, (err, users) =>{
    if(err){
      console.log(err);
    } else {
      const data = JSON.stringify(users);
      fs.writeFileSync("data.csv", data);
      res.download("data.csv");
    }
  });  
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

//All post requests here
app.post("/register", (req, res) => {
  const user = new users({
    name: req.body.username,
    email: req.body.email,
    userRole: req.body.role,
  });
  user.save();
  users.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      }
      passport.authenticate("local")(req, res, () => {
        res.redirect("/home");
      });
    }
  );
});

app.post("/", (req, res) => {
  const user = new users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    userRole: req.body.role,
  });
  req.login(user, (err) => {
    if (err) {
      console.log(err);
    }
    else {
        passport.authenticate("local",)(req, res, () => {
            res.redirect("/home"); 
        });
    }
  });
});

app.post("/edit", (req,res)=>{
  users.updateOne({name: req.body.username},
    {$set: {name: req.body.username, 
      email: req.body.email,
      userRole: req.body.role
    }}, (err, user)=>{
    if (err) {
      console.log(err);
    } else {
      res.redirect("/home");
    }
  });
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
} 

app.listen(port, () =>
  console.log(`Server has started`)
);


// https://mighty-basin-35097.herokuapp.com/