var Mark = require('../schemas').Mark,
    User = require('../schemas').User,
    Item = require('../schemas').Item;

/**
 * 创建一个Item
 */
exports.createItem = function (markId, author, title, tag, date, post, callback) {
	var item = new Item;
	item.markId = markId;
  item.author = author;
	item.post = post;
  item.tag = tag;
  if (!date) date = new Date();
  item.date = date;
  if (!title) title = '';
  item.title = title;
	item.save(callback);
};

exports.getItemById = function (itemId, callback) {
  return Item.findOne({_id: itemId}, callback);
};


exports.getMarkItems = function (markId, callback) {
  Item.find({markId: markId}, null, {sort: {'tag.name': 1, date: 1, created: 1}}).
  populate('tag').
  exec(callback);
};