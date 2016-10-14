var crypto = require('crypto');
var util = require('../lib/utility');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var mongoose = require('mongoose');
var db = mongoose.connection;

db.on('error', console.error);
db.once('open', function() {
  var urlSchema = new mongoose.Schema({
    id: mongoose.Schema.ObjectId,
    url: String,
    baseUrl: String,
    code: String,
    title: String,
    visits: { type: Number, default: 0 },
    timestamps: Date,
  });

  urlSchema.on('save', function(model) {
    model.code = util.createLinkCode(model.url);
  });

  Link = mongoose.model('Link', urlSchema);

  module.exports.Link = Link;

  var userSchema = new mongoose.Schema({
    id: mongoose.Schema.ObjectId,
    username: String,
    password: String,
    timestamps: Date
  });

  userSchema.methods.hashPassword = function(cb) {
    var cipher = Promise.promisify(bcrypt.hash);
    return cipher(this.password, null, null).bind(this)
      .then(function(hash) {
        this.password = hash;
        cb();
      });
  };
  userSchema.pre('save', function(next) {
    this.hashPassword(next);
  });

  User = mongoose.model('User', userSchema);
  module.exports.User = User;

});

mongoose.connect('mongodb://localhost');

module.exports.db = db;






// db.knex.schema.hasTable('urls').then(function(exists) {
//   if (!exists) {
//     db.knex.schema.createTable('urls', function (link) {
//       link.increments('id').primary();
//       link.string('url', 255);
//       link.string('baseUrl', 255);
//       link.string('code', 100);
//       link.string('title', 255);
//       link.integer('visits');
//       link.timestamps();
//     }).then(function (table) {
//       console.log('Created Table', table);
//     });
//   }
// });
  

// db.knex.schema.hasTable('users').then(function(exists) {
//   if (!exists) {
//     db.knex.schema.createTable('users', function (user) {
//       user.increments('id').primary();
//       user.string('username', 100).unique();
//       user.string('password', 100);
//       user.timestamps();
//     }).then(function (table) {
//       console.log('Created Table', table);
//     });
//   }
// });

