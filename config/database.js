require('dotenv').config({
    path: "../.env"
  });
const dbKey = process.env.DB_KEY;
const mongoose = require("mongoose");

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

module.exports = {
    Candidate
}