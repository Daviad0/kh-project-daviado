const express = require("express");
const app = express();
const expressLayouts = require('express-ejs-layouts')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const session = require("express-session");
const mongo = require('mongoose');
const mongoHandler = require("./mongo")
const passwordHandler = require("./passwords");

tokens = {};

const User = require("./mongo_models/user");
const Dish = require("./mongo_models/dish");
const Sponsor = require("./mongo_models/sponsor");
//var passwordHashStuff = passwordHandler.getHashOfPW("ElfOnTheShelf");
//console.log(passwordHashStuff);
//const user = new User({ name: 'David Reeves', username: 'Daviado', joined: new Date(), isSuperuser: true, isRestricted: false, hash: {salt:passwordHashStuff.salt, hashedPW: passwordHashStuff.hashedpassword} });

//mongoHandler.addItem(user);

// our default array of dreams
const dreams = [
  "Find and count some sheep",
  "Climb a really tall mountain",
  "Wash the dishes"
];



// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.set('views', 'views');
app.use(expressLayouts)
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('THIS IS MY FIGHT SONG, TAKE BACK MY LIFE SONG'));
app.use(express.static('public'));

app.use(function (req, res, next) {
  if("customAuthToken" in req.signedCookies){
    if(checkCookie(req.signedCookies["customAuthToken"], false)){
      res.locals.isAuth = true;
      res.locals.user = tokens[req.signedCookies["customAuthToken"]]
      res.locals.token = req.signedCookies["customAuthToken"]
    }else{
      res.locals.isAuth = false;
    }
  }else{
    res.locals.isAuth = false;
  }
  next()
})
// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.render('index', { loggedIn: response.locals.isAuth });
});
app.get("/food", (request, response) => {
  mongoHandler.retrieveAll(Dish,{}).then(function(result){
    response.send(result);
  });
  
});
app.get("/sponsor", (request, response) => {
  var company = request.query.company;
  var fullString = "";
  mongoHandler.retrieveAll(Sponsor, {offeredBy: company}).then(function(resCompany){
    fullString = fullString + resCompany[0].name + "\n\n";
    mongoHandler.retrieveAll(Dish, {offeredBy: resCompany[0].name}).then(function(result){
      fullString = fullString += result
      response.send(fullString);
    });
  });
});
app.get("/home", (request, response) => {
  response.render('index', { loggedIn: response.locals.isAuth });
});
app.get("/login", (request, response) => {
  if(!response.locals.isAuth){
    response.render('login', { loggedIn: response.locals.isAuth });
  }else{
    response.render('account', { loggedIn: response.locals.isAuth, user:response.locals.user });
  }
});
app.get("/register", (request, response) => {
  if(!response.locals.isAuth){
    response.render('register', { loggedIn: response.locals.isAuth });
  }else{
    response.render('account', { loggedIn: response.locals.isAuth, user:response.locals.user });
  }
});
app.get("/account", (request, response) => {
  if(response.locals.isAuth){
    // need to check for a user update!
    
    response.render('account', { loggedIn: response.locals.isAuth, user: response.locals.user });
    updateUserAccount(response.locals.user.username, response.locals.token);
  }else{
    //return to login or home page as no login = nogo
    response.render('index', { loggedIn: response.locals.isAuth });
  }
  
});
app.get("/find", (request, response) => {
  response.render('findforyou', { loggedIn: response.locals.isAuth });
});
app.get("/volunteer", (request, response) => {
  response.render('nearby', { loggedIn: response.locals.isAuth });
});
app.post("/api/login", (request, response) => {
  var username = request.query.username;
  var password = request.query.password;
  if(username == undefined && password == undefined){
    username = request.body.username;
    password = request.body.password;
  }
  console.log("USER: " + username + "; PASSWORD: " + password)
  mongoHandler.handleLogin(username, password, function(result){
    console.log(result)
    if(result.success){
      tokens[result.token] = result.user;
      response.cookie('customAuthToken', result.token, {maxAge: 36000000, signed: true}).send({success: true});
    }else{
      response.send({success: false, token: ''});
    }
  });
  
});

app.post("/api/logout", (request,response) => {
  if(response.locals.isAuth){
    tokens[response.locals.token] = undefined;
    response.cookie('customAuthToken', '', {expires: new Date()}).send({success: true});
  }
  else{
    response.send({success: true});
  }
});

app.post("/api/register", (request,response) => {
  
  if(!response.locals.isAuth){
    var newHash = passwordHandler.getHashOfPW(request.body.password);
    var newUser = new User({name: request.body.fullName, username: request.body.username, isSuperuser: false, isRestricted: false, joined: new Date(), hash: { salt: newHash.salt, hashedPW: newHash.hashedpassword }});
    mongoHandler.handleRegistration(newUser, function(result){
      tokens[result.token] = result.user;
      response.cookie('customAuthToken', result.token, {maxAge: 36000000, signed: true}).send({success: true});
    });
  }
  else{
    response.send({success: false});
  }
});

function updateUserAccount(username, token){
  mongoHandler.retrieveAll(User, {username: username}, function(err,result){
    if(result != []){
      tokens[token] = result[0]
    }
    
  });
}

// Yum!
function checkCookie(cookie, rqSuperUser){
  console.log(tokens)
  if(!(cookie in tokens)){
    return false;
  }else{
    if(!(tokens[cookie].isSuperuser)){
      return false;
    }else{
      return true;
    }
    
  }
  
}

function handleQuery(){
  //for in db

}


// send the default array of dreams to the webpage
app.get("/dreams", (request, response) => {
  // express helps us take JS objects and send them as JSON
  response.json(dreams);
});

// listen for requests :)
const listener = app.listen(8765, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
