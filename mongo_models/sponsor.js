const mongo = require('mongoose');

const sponsor = new mongo.Schema({
    name: String,
    inService: Boolean,
    ratings: [{ by: String, numRating: Number }],
    address: String,
    contactId: String // will be a ID
  });
  
  const Sponsor = mongo.model('Sponsor', sponsor);

module.exports = Sponsor;