var mongo = require('mongodb');
var GridStore = mongo.GridStore;
var MongoServer = mongo.Server;
var ObjectID = mongo.ObjectID;
var Db = mongo.Db;

var hash = require('./pass').hash;

//Connect to MongoDB
var mongoServer = new MongoServer('localhost', 27017, {
    auto_reconnect: true
});
var db = new Db('test', mongoServer);
//Open Connection
db.open(function(err, db) {
    if (err) {
        console.log('Could not connect to MongoDB');
    } else {
        console.log('Connected to MongoDB');
    }
});



var USER = {
    create: function(userObj, callback) {
        console.log("in create");
        USER._encryptAndFormatUser(userObj, function(err, formattedUserObj) {
            if (err) {
                return callback(err);
            }

            db.collection('users', function(err, coll) {
                if (err) {
                    return callback(err);
                }
                coll.insert(formattedUserObj, {
                    safe: true
                }, function(err, formattedUserObj) {
                    USER._returnFormattedUser(err, formattedUserObj, callback);
                });
            });
        });
    },

    read: function(userObj, callback) {
        db.collection('users', function(err, coll) {
            if (err) {
                return callback(err);
            }
            var q = {
                'appId': userObj.appId
            };
            if (userObj.username) {
                q["username"] = userObj.username;
            }
            if (userObj.objectId) {
                  var BSON = require('mongodb').BSONPure;
                  q["_id"] = BSON.ObjectID.createFromHexString(userObj.objectId);
            }
            console.log(JSON.stringify(q));
            coll.findOne(q, callback);
        });
    },

    _encryptAndFormatUser: function(userObj, callback) {
        //add createdAt and updatedAt
        var dateAndTime = toISO8601(new Date());
        userObj["createdAt"] = dateAndTime;
        userObj["updatedAt"] = dateAndTime;
        hash(userObj.password, function(err, salt, hash) {

            if (err) {
                return callback(err);
            }

            delete userObj["password"]; //remove pwd
            userObj["salt"] = salt;
            userObj["hash"] = hash;
            callback(null, userObj);
        });
    },
    _returnFormattedUser: function(err, formattedUserObj, callback) {
        formattedUserObj = formattedUserObj[0] || formattedUserObj;

        var u = {
            "objectId": formattedUserObj["_id"].toString(),
            "createdAt": formattedUserObj["createdAt"]
        };
        callback(err, u, 201);
    }
};

module.exports = {


    createUser: function(userObj, callback) {
        var mandatoryProps = {
            "username": "",
            "password": "",
            "appId": ""
        };
        var missingProps = getMissingProps(userObj, mandatoryProps);
        if (missingProps.length > 0) {
            return callback("missing fields: " + missingProps.join(", "));
        }


        USER.read(userObj, function(err, user) {
            if (err) {
                return callback(err);
            } else if (user) {
                err = {
                    message: "User " + user.username + " already exists"
                };
                return callback(err);
            } else {
                return USER.create(userObj, callback);
            }
        });
    },

    getUser: function(userObj, callback) {
        USER.read(userObj, function(err, userDoc) {
            if (err) {
                return callback(err);
            } else if (!userDoc) {
                err = {
                    message: "User with " + userObj.objectId + " does not exist"
                };
                return callback(err);
            } else {
                var user = {
                    "objectId": userObj.objectId,
                    "createdAt": userDoc["createdAt"],
                    "updatedAt": userDoc["updatedAt"],
                    "email": userDoc["email"],
                    "phone": userDoc["phone"],
                    "company": userDoc["company"]
                };
                return callback(null, user);
            }
        });
    }
};

function getMissingProps(obj, mandatoryProps) {
    var missing = [];
    for (var key in mandatoryProps) {
        console.log("*** " + key);
        var val = obj[key];
        if (!val) {
            missing.push(key);
        }
    }
    return missing;
}

function getSessionToken() {
    var S4 = function() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
    return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4());
}

function toISO8601(date) {
    var pad_two = function(n) {
            return (n < 10 ? '0' : '') + n;
        };
    var pad_three = function(n) {
            return (n < 100 ? '0' : '') + (n < 10 ? '0' : '') + n;
        };
    return [
    date.getUTCFullYear(), '-', pad_two(date.getUTCMonth() + 1), '-', pad_two(date.getUTCDate()), 'T', pad_two(date.getUTCHours()), ':', pad_two(date.getUTCMinutes()), ':', pad_two(date.getUTCSeconds()), '.', pad_three(date.getUTCMilliseconds()), 'Z'].join('');
}