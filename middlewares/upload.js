var fs = require('fs'),
    path = require('path'),
    config = require('../config'),
    im = require('imagemagick'),
    utils = require('../lib/utils');

function randomStr(length){
  if(!length || length <= 0) length = 10;
  var str = "abcdefghijklmnopqrstuvwxyz1234567890_~";
  var result = [], i = 0;
  while(i < length){
    result.push(str[Math.round(Math.random() * (str.length - 1))]);
    i++;
  }
  return result.join('');
}
/**
 * 上传图片中间件, filed名应该为'image'
 */
exports.uploadImage = function(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.json({status: -1, message: '没有权限'});
  }
  var file = req.files && req.files.image;
  if (!file) return res.json({ status: -1, message: '请添加图片' });
  req.session.lastUploadedImage = {
    path: file.path,
    oriname: file.name
  };
  // resize image
  try {
    im.identify(file.path, function (err, f) {
      var opt = {
        srcPath: file.path,
        dstPath: file.path,
        quality: .7
      };
      if (f.width >= f.height && f.width > 1920) {
        opt.width = 1920;
      } else if (f.height > f.width && f.height > 1920){
        opt.height = 1920;
      }
      if (!opt.width && !opt.height) {
        return next();
      }
      im.resize(opt, function (err) {
        if (err) return next(err);
        next();
      });
    });
  } catch(e) {
    console.error(e);
    next();
  }
  
};