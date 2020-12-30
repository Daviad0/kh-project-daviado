const mongo = require('mongoose');

const volunteer = new mongo.Schema({
    joined: Date,
    for: [{ sponsorId: String }],
    contactId: String // will be a Username
  });
  
  const Volunteer = mongo.model('Volunteer', volunteer);

module.exports = Volunteer;