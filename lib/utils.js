var path = require('path'),
    fs = require('fs');

/**
 * @private
 */
 function _mkdir(dir, mode, callback) {
  if(!callback) callback = function () {};
  fs.exists(dir, function (exists) {
    if (exists) {
      return callback();
    }
    fs.mkdir(dir, mode, callback);
  });
}

exports.mkdirp = function mkdir(dir, mode, callback) {
  if (typeof mode === 'function') {
    callback = mode;
    mode = 0777 & (~process.umask());
  }
  var parent = path.dirname(dir);
  fs.exists(parent, function (exists) {
    if (exists) {
      return _mkdir(dir, mode, callback);
    }
    exports.mkdirp(parent, mode, function (err) {
      if (err) {
        return callback(err);
      }
      _mkdir(dir, mode, callback);
    });
  });
};

exports.randomStr = function (length){
  if(!length || length <= 0) length = 10;
  var str = "abcdefghijklmnopqrstuvwxyz1234567890_~";
  var result = [], i = 0;
  while(i < length){
    result.push(str[Math.round(Math.random() * (str.length - 1))]);
    i++;
  }
  return result.join('');
};

exports.fillObject = function (src, target, filed) {
  for (var i = filed.length; i--; ) {
    target[filed[i]] = src[filed[i]];
  }
};

exports.md5 = function (str) {
  var md5sum = require('crypto').createHash('md5');
  md5sum.update(str);
  return md5sum.digest('hex');
};

exports.csrf = require('express').csrf();