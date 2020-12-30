const mongo = require('mongoose');

const request = new mongo.Schema({
    at: Date,
    for: [{ dishId: String }],
    contactId: String // will be a Username
  });
  
  const Request = mongo.model('MealRequest', request);

module.exports = Request;