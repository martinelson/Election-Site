require('dotenv').config();
const dbKey = process.env.DB_KEY;
const newskey = process.env.NEWS_KEY;
const fecKey = process.env.FED_KEY;
const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
//offices import
const federalOffices = require(__dirname + "/objects/federaloffices.json");
const stateOffices = require(__dirname + "/objects/stateoffices.json");
const districtOffices = require(__dirname + "/objects/districtoffices.json");
const countyOffices = require(__dirname + "/objects/countyoffices.json");
const counties = require(__dirname + "/objects/counties.json");
const countyOfficials = require(__dirname + "/objects/countyelectionofficials")
//news api
const NewsAPI = require("newsapi");
const newsapi = new NewsAPI(newskey);

//connect to mongoose package//
mongoose.connect(dbKey, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

//Schemas//
const candidateSchema = {
  officeName: String,
  officeType: String,
  candidateName: String,
  lastName: String,
  county: String,
  email: String,
  party: String,
  city: String,
  occupation: String,
  incumbent: Boolean,
  website: String
};

//establishing schemas with mongoose//
const Candidate = mongoose.model("Candidate", candidateSchema);
//create express app//
const app = express();

//set view engine to ejs//
app.set('view engine', 'ejs');

//using bodyparser and static public files//
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

//GET REQUESTS
app.get("/", function(req, res){
  res.render(__dirname + "/views/home")
});

app.get("/federal", function(req, res){
  Candidate.find({officeType: "FEDERAL"}, function(err, candidates){
    res.render(__dirname+"/views/federal", {
      type: "federal",
      candidates: candidates,
      offices: federalOffices,
      completeOffices: federalOffices
    });
  });
});

app.get("/statewide", function(req, res){
  Candidate.find({officeType: "STATEWIDE"}, function(err, candidates){
    res.render(__dirname+"/views/statewide", {
      type: "statewide",
      candidates: candidates,
      offices: stateOffices
    });
  });
});

app.get("/district", function(req, res){
  Candidate.find({officeType: "DISTRICT RACE"}, function(err, candidates){
    res.render(__dirname+"/views/district", {
      type: "district",
      candidates: candidates,
      offices: districtOffices,
      completeOffices: districtOffices
    });
  });
});

app.get("/county", function(req, res){
    res.render(__dirname+"/views/county", {
      type: "county",
      counties: counties
    });
  });

app.get("/links", function(req, res){
  res.render(__dirname+"/views/links")
});

app.get("/news", function(req,res){
  try{
    newsapi.v2.everything({
       q: 'Texas Elections 2020',
       language: 'en',
       pageSize: 10
     }).then(response => {
       res.render(__dirname+"/views/news", {
         news: response.articles
       })
     });
  }
  catch(err){
    res.send('<link rel="stylesheet" href="/css/style.css"><div class="county main-div"><h1>News currently unavailable. Please try again later.</h1></div>')
  }
});

app.get("/disclaimer", function(req, res){
  res.render(__dirname+"/views/disclaimer")
});


//POST REQUESTS

//county elections
app.post("/countyelections", function(req,res){
  let route_id = req.body.counties;
  if (route_id === ''){
    res.redirect("/county");
  } else{
    const selectedOffices = countyOffices.filter(({County}) => County === route_id);
    const selectedOfficial = countyOfficials.filter(({County}) => County === route_id);
    if(selectedOffices.length === 0){
      res.redirect('/county')
    }
    console.log(selectedOffices.length === 0);
    Candidate.find({county: route_id}, function(err, candidates){
      res.render(__dirname+"/views/countyelections", {
        type: route_id,
        candidates: candidates,
        offices: selectedOffices,
        official: selectedOfficial,
        counties: counties
      });
    });
  }
});

//district elections
app.post("/districtoffices", function(req,res){
  let route_id = req.body.district;
  if (route_id === ''){
    res.redirect("/district")
  } else{
    const selectedDistrict = districtOffices.filter(({Office}) => Office === route_id);
    if(selectedDistrict.length === 0){
      res.redirect('/district')
    }
    Candidate.find({officeName: route_id}, function(err, candidates) {
      res.render(__dirname+"/views/district",{
      candidates: candidates,
      offices: selectedDistrict,
      completeOffices: districtOffices
    });
  });
  }
});

//federal elections
app.post("/federaloffice", function(req,res){
  let route_id = req.body.federal;
  if (route_id === ''){
    res.redirect("/federal")
  } else{
    const selectedFederal = federalOffices.filter(({Office}) => Office === route_id);
    if(selectedFederal.length === 0){
      res.redirect('/federal')
    }
    Candidate.find({officeName: route_id}, function(err, candidates) {
      res.render(__dirname+"/views/federal",{
      candidates: candidates,
      offices: selectedFederal,
      completeOffices: federalOffices
    });
  });
  }
});

//FEC API request
app.post("/finance", function(req, res){
  let fedUrl = ''
  const officeSeat = req.body.seatName;

  Candidate.find({officeName: officeSeat}, function(err, candidates){
    if(err){
      res.send('<link rel="stylesheet" href="/css/style.css"><div class="county main-div"><h1>Finance Data currently unavailable. Please try again later.</h1><br><a class="back-to-fed" href="/federal"><h3 class="back">Back to Federal Candidates</h3></a></div>w')
    }

    //special cases => name conflicts for district 34 and 23
    let queryUrl = ''
    if (officeSeat === "U. S. REPRESENTATIVE DISTRICT 34"){
      queryUrl += '&q=CRISTO&q=ROYAL&q=REY%20GONZALEZ&q=VELA'
    } else if (officeSeat === "U. S. REPRESENTATIVE DISTRICT 23"){
      queryUrl += '&q=GINA%20JONES&q=GONZALES&q=SANDERS&q=VILLELA'
    } else {
      candidates.forEach(function(candidate){
        var lname = candidate.lastName.split(" ").join("%20");
        queryUrl += "&q="+lname;
      });
    }
    //Representative query
    if (officeSeat.includes("REPRESENTATIVE") === true) {
      let office = "H";
      let district = officeSeat.split("U. S. REPRESENTATIVE DISTRICT ")[1];
      fedUrl += "https://api.open.fec.gov/v1/candidates/totals/?election_year=2020&federal_funds_flag=false&district=" + district + "&is_active_candidate=true&per_page=20&election_full=true&state=TX&sort_nulls_last=true" + queryUrl + "&api_key=" + fecKey + "&page=1&office=" + office + "&sort_hide_null=false&sort_null_only=false"
    } else{
      //Senate query
      let office = "S";
      fedUrl += "https://api.open.fec.gov/v1/candidates/totals/?election_year=2020&federal_funds_flag=false&is_active_candidate=true&per_page=20&election_full=true&state=TX&min_cash_on_hand_end_period=1000&has_raised_funds=true&sort_nulls_last=true" + queryUrl + "&api_key=" + fecKey + "&page=1&office=" + office + "&sort_hide_null=false&sort_null_only=false"
    }

    try{
      https.get(fedUrl, function(response){
        response.on("data", function(data){
          const fecData = JSON.parse(data);
          res.render(__dirname+"/views/finance", {
            fecCandidates: fecData.results,
            candidates: candidates
          });
        });
      });
    }
    catch(err){
      res.send('<link rel="stylesheet" href="/css/style.css"><div class="county main-div"><h1>Finance Data currently unavailable. Please try again later.</h1></div>')
    }

  });
});

//error handle
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
