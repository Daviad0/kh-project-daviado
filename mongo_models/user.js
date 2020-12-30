const mongo = require('mongoose');

const user = new mongo.Schema({
    name: String,
    username: String,
    joined: Date,
    isSuperuser: Boolean,
    isRestricted: Boolean,
    interestedIn: [{ idOfObject: String, timeOfInterest: Date}],
    //Volunteer, MealRequest, and Sponsor Schemas will all reference the Username of this user to allow for connection, not the other way around
    hash: { salt: String, hashedPW: String }
  });
  
  const User = mongo.model('User', user);

module.exports = User;