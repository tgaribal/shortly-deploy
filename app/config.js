// var path = require('path');
// var knex = require('knex')({
//   client: 'sqlite3',
//   connection: {
//     filename: path.join(__dirname, '../db/shortly.sqlite')
//   },
//   useNullAsDefault: true
// });
// var db = require('bookshelf')(knex);
var crypto = require('crypto');
var util = require('../lib/utility');

var mongoose = require('mongoose');
var db = mongoose.connection;

db.on('error', console.error);
db.once('open', function() {
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
  
  var urlSchema = new mongoose.Schema({
    id: mongoose.Schema.ObjectId,
    url: String,
    baseUrl: String,
    code: String,
    title: String,
    visits: Number,
    timestamps: Date  
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

  module.exports.User = mongoose.model('User', userSchema);

});

mongoose.connect('mongodb://localhost');
module.exports.db = db;

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

