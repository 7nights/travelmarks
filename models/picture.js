var Mark = require('../schemas').Mark,
    User = require('../schemas').User,
    Picture = require('../schemas').Picture,
    Item = require('../schemas').Item;

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