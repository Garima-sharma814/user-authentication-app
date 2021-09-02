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
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;

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
mongoose
  .connect(process.env.connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user", userSchema);

passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          return done(null, false, { message: "Email not registered" });
        }
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Password incorrect" });
          }
        });
      })
      .catch((err) => console.log(err));
  })
);
// passport.use(users.createStrategy());
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// All the get requests here
app.get("/", (req, res) => {
  res.render("login", {
    title: "Login Page",
  });
});

app.get("/register", (req, res) => {
  res.render("register", {
    title: "Register Page",
  });
});

app.get("/admin", (req, res) => {
  // if (req.isAuthenticated()) {
  res.render("admin");
  // } else {
  //   res.redirect("/");
  // }
});

app.get("/client", (req, res) => {
  // if (req.isAuthenticated()) {
  res.render("client");
  // } else {
  //   res.redirect("/unauthorized");
  // }
});

app.get("/unauthorized", (req, res) => {
  res.render("unauthorized", {
    title: "Unauthorized user",
    btn: "Go back",
    logaction: "/home",
  });
});

app.get("/edit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("edit", {
      title: "Edit",
      btn: "Edit",
      formaction: "/edit",
      name: req.user.username,
    });
  } else {
    res.redirect("/unauthorized");
  }
});

app.get("/download", (req, res) => {
  console.log(req.user);
  User.find({ username: req.user.username }, (err, loggedinUser) => {
    if (loggedinUser.userRole === "Admin") {
      User.find({}, (err, users) => {
        if (err) {
          console.log(err);
        } else {
          const data = JSON.stringify(users);
          fs.writeFileSync("data.json", data);
          res.download("data.json");
        }
      });
    }
  });
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

//All post requests here
app.post("/register", (req, res) => {
  const { name, email, password, role } = req.body;
  let errors = [];

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

app.post("/", (req, res, next) => {
  User.findOne({ email: req.body.email }, (err, loggedinUser) => {
    console.log(loggedinUser);
    var role = _.lowerCase(loggedinUser.role);
    console.log(role);
    if (role === "admin") {
      passport.authenticate("local", {
        successRedirect: "/admin",
        failureRedirect: "/",
      })(req, res, next);
    }else{
      passport.authenticate("local", {
        successRedirect: "/client",
        failureRedirect: "/",
      })(req, res, next);
    }
  });
});

app.post("/edit", (req, res) => {
  User.updateOne(
    { name: req.body.username },
    {
      $set: {
        name: req.body.username,
        email: req.body.email,
        userRole: req.body.role,
      },
    },
    (err, user) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/home");
      }
    }
  );
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 5000;
}

app.listen(port, () => console.log(`Server has started`));

// https://mighty-basin-35097.herokuapp.com/
