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
const Volunteer = require("./mongo_models/volunteer");
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

app.get("/sponsor", (request, response) => {
  mongoHandler.retrieveAllById(Sponsor, request.query.sponsorId).then(function(result){
    mongoHandler.retrieveAll(Dish, {offeredById: result._id.toString()}).then(function(dishes){
      if(result != undefined){
        var wanted = [];
        if(response.locals.isAuth){
          tokens[response.locals.token].interestedIn.forEach(e => {
            wanted.push(e.idOfObject);
          });
          if(response.locals.user._id.toString() == result.contactId.toString()){
            response.render('sponsor', { loggedIn: response.locals.isAuth, administrator: true, sponsor: result, dishes: dishes, wanted: wanted });
          }else{
            response.render('sponsor', { loggedIn: response.locals.isAuth, administrator: false, sponsor: result, dishes: dishes, wanted: wanted });
          }
          
        }else{
          response.render('sponsor', { loggedIn: response.locals.isAuth, administrator: false, sponsor: result, dishes: dishes, wanted: wanted });
        }
      }else{
        response.render("index", { loggedIn: response.locals.isAuth })
      }
    });
    
  });
  
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
  if("sweetness" in request.query){
    var details = {sweetness: request.query.sweetness, strength: request.query.strength, fruity: request.query.fruity, smooth: request.query.smooth, liquid: request.query.liquid, vegetarian: request.query.vegetarian, lactose: request.query.lactose, gluten: request.query.gluten};
    mongoHandler.retrieveAll(Dish, {}).then(function(result){
      var scores = {}
      for(i = 0;i < result.length;i++){
        e = result[i]
        var localscore = 0;
        // Sweetness
        if(Math.abs(e.sweetness - details.sweetness) > 3){
          localscore -= 1;
        }else if(Math.abs(e.sweetness - details.sweetness) < 2){
          localscore += 1;
        }
        // Strength
        if(Math.abs(e.strength - details.strength) > 3){
          localscore -= 1;
        }else if(Math.abs(e.strength - details.strength) < 2){
          localscore += 1;
        }
        // Gluten
        var gluten = details.gluten == 1 ? true : false
        if(gluten == e.gluten){
          localscore += 1;
        }else{
          if(!gluten){
            localscore -= 5;
          }else{
            localscore -= 1;
          }
        }
        // Lactose
        var lactose = details.lactose == 1 ? true : false
        if(lactose == e.lactose){
          localscore += 1;
        }else{
          if(!lactose){
            localscore -= 5;
          }else{
            localscore -= 1;
          }
        }
        // Vegetarian
        if(details.vegetarian != 0){
          var vegetarian = details.vegetarian == 1 ? true : false
          if(vegetarian == e.vegetarian){
            localscore += 1;
          }else{
            if(vegetarian){
              localscore -= 5;
            }else{
              localscore -= 1;
            }
            
          }
        }
        // Fruity
        if(details.fruity != 0){
          var fruity = details.fruity == 1 ? true : false
          if(fruity == e.fruity){
            localscore += 1;
          }else{
            localscore -= 1;
            
          }
        }
        // Smooth
        if(details.smooth != 0){
          var smooth = details.smooth == 1 ? true : false
          if(smooth == e.smooth){
            localscore += 1;
          }else{
            localscore -= 1;
            
          }
        }
        // Liquid
        if(details.liquid != 0){
          var liquid = details.liquid == 1 ? true : false
          if(liquid == e.liquid){
            localscore += 1;
          }else{
            localscore -= 1;
            
          }
        }
        scores[i] = localscore;
      }
      var objects = [];
      Object.keys(scores).forEach(e => {
        if(scores[e] > 0){
          var addScoreTo = result[e]
          addScoreTo.score = scores[e];
          objects.push(addScoreTo);
          console.log(e + " at score " + scores[e]);
        }
        console.log(e + " at score " + scores[e]);
      });
      mongoHandler.retrieveAll(Sponsor, {}).then(function(sponsors){
        var condensedSponsorDict = {};
        sponsors.forEach(e => {
          condensedSponsorDict[e._id.toString()] = e.name;
        });
        response.render('findresults', {loggedIn: response.locals.isAuth, dishes: objects, sponsors: condensedSponsorDict});
      });
      
    })
  }else{
    response.render('findforyou', { loggedIn: response.locals.isAuth });
  }
  
  
});

app.get("/volunteer", (request, response) => {
  if(response.locals.isAuth){
    mongoHandler.retrieveAll(Volunteer, { contactId: response.locals.user._id }).then(function(result){
      var isVolunteer = false;
      var sponsorIds = [];
      if(result.length != 0 && result != undefined){
        result = result[0]
        isVolunteer = true;
        result.for.forEach(e => {
          sponsorIds.push(e.sponsorId);
        });
      }
      mongoHandler.retrieveAll(Sponsor, {}).then(function(result){
        response.render('nearby', { loggedIn: response.locals.isAuth, sponsors: result, isVolunteer: isVolunteer, volunteerInstance: (result != [] ? sponsorIds : []) });
      });
    })
    
  }else{
    response.render('login', { loggedIn: response.locals.isAuth });
  }
  
  
});
app.get("/dishcatalog", (request, response) => {
  mongoHandler.retrieveAll(Dish, {}).then(function(result){
    mongoHandler.retrieveAll(Sponsor, {}).then(function(sponsors){
      var condensedSponsorDict = {};
      sponsors.forEach(e => {
        condensedSponsorDict[e._id.toString()] = e.name;
      });
      var wanted = [];
      if(response.locals.isAuth){
        tokens[response.locals.token].interestedIn.forEach(e => {
          wanted.push(e.idOfObject);
        });
      }
      response.render('alldishes', { loggedIn: response.locals.isAuth, dishes: result, wanted: wanted, sponsors: condensedSponsorDict });
    });
    
    
  });
  
});

app.post("/api/volunteer/create", (request, response) => {
  if(response.locals.isAuth){
    mongoHandler.retrieveAll(Volunteer, { contactId: response.locals.user._id} ).then(function(result){
      if(result.length != 0 && result != undefined){
        response.send({success: false});
      }else{
        var newVolunteer = new Volunteer({ joined: new Date(), for: [], contactId: response.locals.user._id});
        mongoHandler.addItemWait(newVolunteer).then(function(savedVolunteer){
          response.send({success: true});
        });
      }
    });
  }
  else{
    response.send({success: false});
  }
});

app.post("/api/volunteer", (request, response) => {
  if(response.locals.isAuth){
    mongoHandler.retrieveAll(Volunteer, { contactId: response.locals.user._id} ).then(function(result){
      if(result == []){
        response.send({success: false});
      }else{
        result = result[0]
        if(request.body.add == 0){
          result.for = result.for.filter(function(el){ return el.sponsorId != request.body.sponsorId });
          //need to update db
        }else{
          if(result.for == undefined){
            result.for = []
          }
          result.for.push({sponsorId: request.body.sponsorId});
          toBeWanted = true;
        }
        mongoHandler.updateItem(Volunteer, result, function(newVolunteer){
          response.send({success: true});
        });
      }
    });
  }
  else{
    response.send({success: false});
  }
});

app.post("/api/sponsor/create", (request,response) => {
  if(response.locals.isAuth){
    var newSponsor = new Sponsor({name: request.body.name, inService: true, ratings: [], contactId: response.locals.user._id, address: request.body.address});
    mongoHandler.addItemWait(newSponsor).then(function(result){
      response.send({success: true, sponsor: result});
    });
  }
  else{
    response.send({success: false});
  }
});

app.post("/api/dish/create", (request,response) => {
  if(response.locals.isAuth){
    // need an extra check to make sure that the user actually has authorization to say what the sponsor is donating :)
    // contactId will be gotten from db to avoid any security flaws
    mongoHandler.retrieveAllById(Sponsor, request.body.sponsorId).then(function(result){
      if(result != []){
        if(response.locals.user._id == result.contactId || checkCookie(response.locals.token,true)){
          var newDish = new Dish({name: request.body.name, sweetness: request.body.sweetness, fruity: request.body.fruity, vegetarian: request.body.vegetarian, strength: request.body.strength, liquid: request.body.liquid, smooth: request.body.smooth, lactose: request.body.lactose, gluten: request.body.gluten, available: true, offeredById: request.body.sponsorId});
          mongoHandler.addItemWait(newDish).then(function(dishSaved){
            response.send({success: true, dish: dishSaved});
          });
        }else{
          response.send({success: false});
        }
        
      }else{
        response.send({success: false});
      }
      
    })
    
    
  }
  else{
    response.send({success: false});
  }
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

app.post("/api/want", (request,response) => {
  if(response.locals.isAuth){
    var toBeWanted = false;
    console.log(request.body)
    console.log(tokens[response.locals.token].interestedIn.filter(e => e.idOfObject === request.body._id.toString()).length)
    if(tokens[response.locals.token].interestedIn.filter(e => e.idOfObject === request.body._id.toString()).length > 0){
      tokens[response.locals.token].interestedIn = tokens[response.locals.token].interestedIn.filter(function(el){ return el.idOfObject != request.body._id.toString() });
      //need to update db
      toBeWanted = false;
    }else{
      console.log(request.body._id.toString())
      tokens[response.locals.token].interestedIn.push({idOfObject: request.body._id.toString(), timeOfInterest: new Date()});
      toBeWanted = true;
    }
    console.log(tokens[response.locals.token].interestedIn)
    console.log(toBeWanted)
    mongoHandler.updateItem(User, tokens[response.locals.token], function(newItem){
      response.send({success: true, nowWanted: toBeWanted});
      updateUserAccount(response.locals.user.username, response.locals.token);
    });
    
  }
  else{
    //force load to login page
    response.send({success: false});
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
  mongoHandler.retrieveAll(User, {username: username}).then(function(result){
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
    if(rqSuperUser){
      if(!(tokens[cookie].isSuperuser)){
        return false;
      }else{
        return true;
      }
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
