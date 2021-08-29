require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

const port = 80;
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
  });
});

app.get("/register", (req, res) => {
  res.render("register", {
    title: "Register",
    btn: "Sign up",
    formaction: "/register",
  });
});

app.get("/home", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("home", {
      title: "Home",
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
    logaction: "/register",
  });
});

app.get("/details", (req,res) =>{
  users.find({}, function (err, users) {
      if (err) {
          console.log(err);
      } else {
          res.render("details", { 
            title: "user data",
            details: users });
      }
  })
})

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

//All post requests here
app.post("/register", (req, res) => {
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
    userRole: req.body.userRole,
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

app.listen(port, () =>
  console.log(`Server is running at http://${hostname}:${port}`)
);
