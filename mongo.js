const mongo = require('mongoose');
const Dish = require('./mongo_models/dish');
const passwordHandler = require("./passwords")
const User = require('./mongo_models/user')
const crypto = require('crypto')


addQueue = [];

mongo.connect('mongodb+srv://justMonika:yourReality@secureaty.remhn.mongodb.net/Secureaty?retryWrites=true&w=majority', {useNewUrlParser: true});
const db = mongo.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    addQueue.forEach(element => {
        element.save();
    });
    console.log("MongoDB Open!")
});

exports.addItem = function(model){
    console.log(db.readyState)
    if(db.readyState == 1){
        model.save();
    }else if(db.readyState == 2){
        addQueue.push(model);
    }
};

exports.retrieveAll = async function(type,parameters){
    return type.find(function(err,allOfType){
        return allOfType;
    });
}

exports.handleLogin = async function(username, password,callback){
    User.find({username: username}, function(err, user){
        var returnObject = {};
        if(user.length > 0){
            user = user[0];
            if(!passwordHandler.checkHashOfPW(password, user.hash.salt, user.hash.hashedPW)){
                returnObject = {user: user, success: false, token: ''};
                callback(returnObject);
                
            }else{
                var psuedoToken = crypto.randomBytes(64).toString('hex');
                returnObject = {user: user, success: true, token: psuedoToken};
                callback(returnObject);
            }
            
        }else{
            returnObject = {user: null, success: false, token: ''};
            callback(returnObject);
        }
        
    })
}

exports.handleRegistration = function(userModel, callback){
    userModel.save(function(err, user){
        var psuedoToken = crypto.randomBytes(64).toString('hex');
        callback({user:user, success: true, token: psuedoToken});
    });
}