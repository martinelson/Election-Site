require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const getRoutes = require(__dirname + "/routes/get.js");
const postRoutes = require(__dirname + "/routes/post.js");

//create express app//
const app = express();

//set view engine to ejs//
app.set('view engine', 'ejs');

//middleware//
app.use(express.urlencoded({
  extended: true
}));
app.use(express.static("public"));
//routes//
app.use(getRoutes);
app.use(postRoutes);

//error handle//
app.use(function(req, res, next) {
  res.status(404).render(__dirname + "/views/404", {
    title: "Page not found"
  });
});

//port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
