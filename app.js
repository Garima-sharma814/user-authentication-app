require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");

const app = express();

//View engine
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Storing the Session for the user 
app.use(
  session({
    secret: process.env.secret,
    resave: true,
    saveUninitialized: true,
  })
);

//Passport config
require("./config/passport")(passport);

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Connect to MongoDB
mongoose
  .connect(process.env.connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Connect to MongoDB locally
// mongoose.connect("mongodb://localhost:27017/userDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

//routes
app.use("/", require("./routes/index"));
app.use("/users", require("./routes/users"));

// Setting up the port for hosted and local app
let port = process.env.PORT;
if (port == null || port == "") {
  port = 5000;
}

// Server listening at port 5000 locally
app.listen(port, () => console.log(`Server has started`));

// Hosted app link
// https://mighty-basin-35097.herokuapp.com/
