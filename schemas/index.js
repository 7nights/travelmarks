var mongoose = require('mongoose'),
    config = require('../config');

mongoose.connect(config.db, function(err) {
  if(err) {
    console.error('connect to %s error: ', config.db, err.message);
    process.exit(1);
  }
});

require('./user');
require('./mark');
require('./item');
require('./picture');

exports.User = mongoose.model('User');
exports.Mark = mongoose.model('Mark');
exports.Item = mongoose.model('Item');
exports.Picture = mongoose.model('Picture');