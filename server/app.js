/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  http = require('http'),
  path = require('path'),
  connectUtils = require('express/node_modules/connect/lib/utils.js');
db = require('./db.js');


var memoryStore = new express.session.MemoryStore();

var headers = {
  "X-Parse-Application-Id": "Rq9rbLOa3m2xKddfS1Y2ThyxJmYWfGURyre6DvbD",
  "X-Parse-REST-API-Key": "aUEPcuWynVXwJK5qjnHeIYGCLHHgNER5huipippT"
};



var app = express();
var expressSessionSecret = 'your secret here';

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(validate);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.cookieParser());
  app.use(express.session({
    store: memoryStore,
    secret: expressSessionSecret,
    key: 'jsessionid'
  }));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

//Function callback
var fn = function(req, res) {
    res.contentType('application/json');
    var fn = function(err, object, httpStatusCode) {
        if (err) {
          httpStatusCode = httpStatusCode || 400;
          if (err.message) {
            object = {
              error: err.message,
              code: 400
            };
          } else {
            object = {
              error: JSON.stringify(err)
            };
          }
        } else {
          //create signed session token (currently this same as session-cookie's value)
          object["sessionToken"] = req.sessionTokenFromClient || connectUtils.sign(req.sessionID, expressSessionSecret);
        }
        httpStatusCode = httpStatusCode || 200;
        res.status(httpStatusCode).send(object);
      };
    return fn;
  };

//Check headers..

function validate(req, res, next) {
  var appId = req.get('X-Parse-Application-Id');
  var restId = req.get('X-Parse-REST-API-Key');
  debugger;
  var sessionTokenFromClient = req.get('X-Parse-Session-Token');
  if (!appId || (!restId && !jsId)) {
    res.send({
      code: 404,
      error: "invalid request"
    });
  } else if((req.method == "POST" || req.method == "PUT") && !req.is('application/json')) {
    res.send({
      code: 404,
      error: "POST, PUT content-type should be of type application/json"
    });
  } else if (sessionTokenFromClient) {
    //get sid by unsigning
    var sid = connectUtils.unsign(sessionTokenFromClient, expressSessionSecret);
    //see if there is a session for sid
    var session = memoryStore.sessions[sid];
    if (session) {
      req.session = session;
      req.sessionID = sid;
      req.sessionTokenFromClient = sessionTokenFromClient;
      next(); //continue
    } else {
      res.send({
        code: 404,
        error: "UnAuthorized connection. Invalid or Expired SessionToken"
      });
    }
  } else {
    next();
  }
}

//Register...
app.post('/1/users', function(req, res) {
  var body = req.body;
    var userObj = {
    'username': body.username,
    'password': body.password,
    'email': body.email,
    'company': body.company,
    'phone': body.phone,
    'appId': headers["X-Parse-Application-Id"]
  };
  db.createUser(userObj, fn(req, res));
});

app.get('/1/users', function(req, res) {
    console.log(1);
res.send(1);
});

app.get('/1/users/:objectId', function(req, res) {
  var userObj = {objectId: req.params.objectId, appId: req.get('X-Parse-Application-Id')};
  db.getUser(userObj, fn(req, res));
});

/*
// Read 
app.get('/api/:collection/:id', function(req, res) {
    db.collection(req.params.collection).findOne({_id:objectId(req.params.id)}, fn(req, res))
});

// Save 
app.post('/api/:collection', function(req, res) {
    if (req.body._id) { req.body._id = objectId(req.body._id);}
    db.collection(req.params.collection).save(req.body, {safe:true}, fn(req, res));
});

// Delete
app.del('/api/:collection/:id', function(req, res) {
    db.collection(req.params.collection).remove({_id:objectId(req.params.id)}, {safe:true}, fn(req, res));
});

//Group
app.put('/api/:collection/group', function(req, res) {
    db.collection(req.params.collection).group(req.body.keys, req.body.cond, req.body.initial, req.body.reduce, req.body.finalize, fn(req, res))
});


app.post('/users', function(req, res) {
  console.log('/users');
  res.send({
    url: '/users'
  });
});

app.post('/classes', function(req, res) {
  console.log('/classes');
  res.send({
    url: '/classes'
  });
});

app.post('/login', function(req, res) {
  console.log('/login');
  res.send({
    url: '/login'
  });
});

app.get('/requestPasswordReset', function(req, res) {
  console.log('/requestPasswordReset');
  res.send({
    url: '/requestPasswordReset'
  });
});
*/

http.createServer(app).listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});