var Mark = require('../schemas').Mark,
    User = require('../schemas').User,
    Item = require('../schemas').Item,
    Tag = require('../schemas').Tag;

/**
 * 创建一个tag
 */
exports.createTag = function (markId, name, addr, lat, lng, callback) {
  var tag = new Tag;
  tag.markId = markId;
  tag.name = name;
  tag.addr = addr;
  tag.lat = lat;
  tag.lng = lng;
  tag.save(callback);
};

exports.getTagById = function (tagId, callback) {
  Tag.find({_id: tagId}, callback);
};