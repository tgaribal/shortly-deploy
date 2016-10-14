var db = require('../config');
var crypto = require('crypto');
var mongoose = require('mongoose');


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


module.exports = Link;
