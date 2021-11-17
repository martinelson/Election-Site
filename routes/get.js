require('dotenv').config({
    path: "../.env"
  });
const dbConnection = require("../config/database.js");
const Candidate = dbConnection.Candidate;
const router = require("express").Router();
const newskey = process.env.NEWS_KEY;
//offices import
const federalOffices = require("../objects/federaloffices.json");
const stateOffices = require("../objects/stateoffices.json");
const districtOffices = require("../objects/districtoffices.json");
const counties = require("../objects/counties.json");
//news api
const NewsAPI = require("newsapi");
const newsapi = new NewsAPI(newskey);



//GET REQUESTS
router.get("/", function(req, res){
    res.render("../views/home")
  });
  
router.get("/federal", function(req, res){
    Candidate.find({officeType: "FEDERAL"}, function(err, candidates){
      res.render("../views/federal", {
        type: "federal",
        candidates: candidates,
        offices: federalOffices,
        completeOffices: federalOffices
      });
    });
  });
  
  router.get("/statewide", function(req, res){
    Candidate.find({officeType: "STATEWIDE"}, function(err, candidates){
      res.render("../views/statewide", {
        type: "statewide",
        candidates: candidates,
        offices: stateOffices
      });
    });
  });
  
  router.get("/district", function(req, res){
    Candidate.find({officeType: "DISTRICT RACE"}, function(err, candidates){
      res.render("../views/district", {
        type: "district",
        candidates: candidates,
        offices: districtOffices,
        completeOffices: districtOffices
      });
    });
  });
  
  router.get("/county", function(req, res){
      res.render("../views/county", {
        type: "county",
        counties: counties
      });
    });
  
  router.get("/links", function(req, res){
    res.render("../views/links")
  });
  
  router.get("/news", function(req,res){
    try{
      newsapi.v2.everything({
         q: 'Texas Elections',
         language: 'en',
         pageSize: 10
       }).then(response => {
         res.render("../views/news", {
           news: response.articles
         })
       });
    }
    catch(err){
      res.send('<link rel="stylesheet" href="/css/style.css"><div class="county main-div"><h1>News currently unavailable. Please try again later.</h1></div>')
    }
  });
  
  router.get("/disclaimer", function(req, res){
    res.render("../views/disclaimer")
  });

  module.exports = router;