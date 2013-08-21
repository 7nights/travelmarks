var Mark = require('../schemas').Mark,
    User = require('../schemas').User,
    Picture = require('../schemas').Picture,
    Item = require('../schemas').Item,
    EventProxy = require('eventproxy');

exports.savePicture = function (filename, oriname, rotate, author, callback) {
  if(!rotate) rotate = 0;
  var pic = new Picture;
  pic.filename = filename;
  pic.oriname = oriname;
  pic.author = author;
  pic.rotate = rotate;
  pic.save(callback);
};

exports.countPicturesByAuthor = function (id, callback) {
  Picture.count({author: id}, callback);
};

exports.deletePictures = function (pics, callback) {
  var ep = new EventProxy();
  ep.after('deleted', pics.length, function (list) {
    if (typeof callback === 'function') callback();
  });
  pics.forEach(function (val, i) {
    Picture.remove({
      filename: val
    }, function (err) {
      ep.emit('deleted');
    });
    require('fs').unlink(require('path').join('public/', val));
  });
};