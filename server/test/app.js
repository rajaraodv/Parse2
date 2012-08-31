var request = require('request');
var assert = require('chai').assert;
var expect = require('chai').expect;
var should = require('chai').should();

var foo = 'bar'
var beverages = {
  tea: ['chai', 'matcha', 'oolong']
};


describe('/users', function() {
  it('GET should throw error', function(done) {
    request('http://localhost:3000/users', function(error, response, body) {
      should.not.exist(error);
      should.exist(response);
      response.statusCode.should.equal(404);
      done();
    });
  });

  it('POST http://localhost:3000/1/users', function(done) {
    var postParams = {
      url: 'http://localhost:3000/1/users',
      headers: {
        'X-Parse-Application-Id': "nJ7p8ebfI095HmwC3OhiT3hhYKDjWxmDZ6QvRRbA",
        "X-Parse-REST-API-Key": "gyqxzOMtoDMOvD3MNMtDr3B5WF7yFHHvgxGWxeet",
        "Content-type": "application/json"
      },
      body: "{}"
    };

    request.post(postParams, function(error, response, body) {
      should.not.exist(error);
      should.exist(response);
      response.statusCode.should.equal(200);
      body = JSON.parse(body);
      expect(body).to.eql({
        url: '/1/users'
      });
      done();
    });
  });

});