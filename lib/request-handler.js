var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');
var Promise = require('bluebird');

var db = require('../app/config');
// var User = db.User;
// var Link = db.Link;
// var Users = require('../app/collections/users');
// var Links = require('../app/collections/links');



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
  //took out Bookshelf .reset() method
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
        // .exec()
        .save(function(err, newLink) {
          if (err) { return console.error(err); }
          res.status(200).send(newLink);
        });
      });
    }
  });

  // new Link({ url: uri }).fetch().then(function(found) {
  //   if (found) {
  //     res.status(200).send(found.attributes);
  //   } else {
  //     util.getUrlTitle(uri, function(err, title) {
  //       if (err) {
  //         console.log('Error reading URL heading: ', err);
  //         return res.sendStatus(404);
  //       }
  //       var newLink = new Link({
  //         url: uri,
  //         title: title,
  //         baseUrl: req.headers.origin
  //       });
  //       newLink.save().then(function(newLink) {
  //         Links.add(newLink);
  //         res.status(200).send(newLink);
  //       });
  //     });
  //   }
  // });
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
          console.log('match!');
          util.createSession(req, res, user);
        } else {
          console.log('no match :(');
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

  // new User({ username: username })
  //   .fetch()
  //   .then(function(user) {
  //     if (!user) {
  //       var newUser = new User({
  //         username: username,
  //         password: password
  //       });
  //       newUser.save()
  //         .then(function(newUser) {
  //           Users.add(newUser);
  //           util.createSession(req, res, newUser);
  //         });
  //     } else {
  //       console.log('Account already exists');
  //       res.redirect('/signup');
  //     }
  //   });

exports.navToLink = function(req, res) {
  db.Link.findOne({ code: req.params[0] }).exec(function(err, link) {
    if (!link) {
      res.redirect('/');
    } else {
      link.visits++;
      console.log('visits: ', link.visits);
      link.save({ visits: link.visits + 1 })
        .then(function() {
          return res.redirect(link.url);
        });
    }
  });
};