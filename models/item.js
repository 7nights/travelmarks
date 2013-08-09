var Mark = require('../schemas').Mark,
    User = require('../schemas').User,
    Item = require('../schemas').Item;

/**
 * 创建一个Item
 */
exports.createItem = function (markId, author, title, date, post, callback) {
	var item = new Item;
	item.markId = markId;
  item.author = author;
	item.post = post;
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
  Item.find({markId: markId}, null, {sort: {date: 1}}, callback);
};