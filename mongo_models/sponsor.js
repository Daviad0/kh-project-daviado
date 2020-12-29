const mongo = require('mongoose');

const sponsor = new mongo.Schema({
    name: String,
    inService: Boolean,
    ratings: [{ by: String, numRating: Number }],
    contact: String // will be a Username
  });
  
  const Sponsor = mongo.model('Sponsor', sponsor);

module.exports = Sponsor;