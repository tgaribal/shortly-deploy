var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  id: mongoose.Schema.ObjectId,
  username: String,
  password: String,
  timestamps: Date
});

User = mongoose.model('User', userSchema);

User.prototype.hashPassword = function(next) {
  var cipher = Promise.promisify(bcrypt.hash);
  return cipher(this.password, null, null).bind(this)
    .then(function(hash) {
      this.password = hash;
      next();
    });
};

userSchema.pre('save', function(next) {
  this.hashPassword(next);
});

module.exports = User;
