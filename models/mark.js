var Mark = require('../schemas').Mark,
    User = require('../schemas').User;

/**
 * 创建一个mark
 */
exports.create = function (title, summary, date, author, latitude, longtitude, position, callback){
  var mark = new Mark;
  mark.title = title;
  mark.summary = summary;
  mark.date = date;
  mark.author = author;
  mark.latitude = latitude;
  mark.longtitude = longtitude;
  mark.location = position;
  mark.save(callback);
};

/**
 * 根据author查找mark
 * @param {ObjectId} userId
 * @param {Function} callback
 * @param {Number} page 第几页
 * @param {Number} size 每页多少项
 */
exports.getMarksByAuthor = function (userId, opt, callback, page, size) {
  !page && (page = 0);
  !size && (size = 10);
  Mark.find({
    'author': userId
  }, null, opt).skip(page * size).limit(size).exec(callback);
};

/**
 * @param {Object} query
 * @param {Object} opt
 * @param {Function} callback
 */
exports.getMarksByQuery = function (query, opt, callback) {
  Mark.find(query, {}, opt, callback);
};

exports.countMarksByAuthor = function (id, callback) {
  Mark.count({author: id}, callback);
};

exports.getMarkById = function (id, callback) {
  Mark.findOne({_id: id}, callback);
};