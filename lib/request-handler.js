var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');
var Promise = require('bluebird');

var db = require('../app/config');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  db.Link.find().exec(function(err, links) {
    res.status(200).send(links);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }
  db.Link.findOne({ 'url': uri }).exec(function (err, link) {
    if (link) {
      res.status(200).send(link);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }
        var newLink = new db.Link({
          url: uri,
          title: title,
          code: util.createLinkCode(uri),
          baseUrl: req.headers.origin
        })
        .save(function(err, newLink) {
          if (err) { return console.error(err); }
          res.status(200).send(newLink);
        });
      });
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  db.User.findOne({ username: username }).exec(function (err, user) {
    if (!user) {
      res.redirect('/login');
    } else {
      util.comparePassword(password, user.password, function(match) {
        if (match) {
          util.createSession(req, res, user);
        } else {
          res.redirect('/login');
        }
      });
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  db.User.findOne({ username: username }).exec(function (err, user) {
    if (user) {
      console.log('Account already exists');
      res.redirect('/signup');
    } else {
      var newUser = new db.User({ 
        username: username,
        password: password
      });
      newUser.save(function(err, newUser) {
        util.createSession(req, res, newUser);
      });
    }
  });
};

exports.navToLink = function(req, res) {
  db.Link.findOne({ code: req.params[0] }).exec(function(err, link) {
    if (!link) {
      res.redirect('/');
    } else {
      link.visits++;
      link.save()
        .then(function() {
          return res.redirect(link.url);
        });
    }
  });
};