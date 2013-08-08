var fs = require('fs'),
    path = require('path'),
    config = require('../config'),
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
  next();
};