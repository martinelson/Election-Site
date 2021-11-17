require('dotenv').config({
    path: "../.env"
  });
const router = require("express").Router();
const dbConnection = require("../config/database.js");
const Candidate = dbConnection.Candidate;
const https = require("https");
const fecKey = process.env.FED_KEY;
//offices import
const federalOffices = require("../objects/federaloffices.json");
const districtOffices = require("../objects/districtoffices.json");
const countyOffices = require("../objects/countyoffices.json");
const counties = require("../objects/counties.json");
const countyOfficials = require("../objects/countyelectionofficials")


//POST REQUESTS

//county elections
router.post("/countyelections", function(req,res){
    let route_id = req.body.counties;
    if (route_id === ''){
      res.redirect("/county");
    } else{
      const selectedOffices = countyOffices.filter(({County}) => County === route_id);
      const selectedOfficial = countyOfficials.filter(({County}) => County === route_id);
      if(selectedOffices.length === 0){
        res.redirect('/county')
      }
      Candidate.find({county: route_id}, function(err, candidates){
        res.render("../views/countyelections", {
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
  router.post("/districtoffices", function(req,res){
    let route_id = req.body.district;
    if (route_id === ''){
      res.redirect("/district")
    } else{
      const selectedDistrict = districtOffices.filter(({Office}) => Office === route_id);
      if(selectedDistrict.length === 0){
        res.redirect('/district')
      }
      Candidate.find({officeName: route_id}, function(err, candidates) {
        res.render("../views/district",{
        candidates: candidates,
        offices: selectedDistrict,
        completeOffices: districtOffices
      });
    });
    }
  });
  
  //federal elections
  router.post("/federaloffice", function(req,res){
    let route_id = req.body.federal;
    if (route_id === ''){
      res.redirect("/federal")
    } else{
      const selectedFederal = federalOffices.filter(({Office}) => Office === route_id);
      if(selectedFederal.length === 0){
        res.redirect('/federal')
      }
      Candidate.find({officeName: route_id}, function(err, candidates) {
        res.render("../views/federal",{
        candidates: candidates,
        offices: selectedFederal,
        completeOffices: federalOffices
      });
    });
    }
  });
  
  //FEC API request
  router.post("/finance", function(req, res){
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
            res.render("../views/finance", {
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

  module.exports = router;