const mongo = require('mongoose');

const request = new mongo.Schema({
    at: Date,
    for: [{ dishName: String, from: String }],
    contact: String // will be a Username
  });
  
  const Request = mongo.model('MealRequest', request);

module.exports = Request;