var Like = require('../schemas').Like,
    EventProxy = require('eventproxy');

/*
 * 获取一个mark的like总数，以及一个用户是否对这个mark标注了喜欢
 * @param {ObjectId} markId
 * @param {ObjectId} userId
 */
exports.getInfo = function (markId, userId, callback) {
  var ep = EventProxy.create(['like-count', 'user-liked'], function (count, liked) {
    callback(count, liked);
  });
  Like.count({mark: markId}, function (err, result) {
    ep.emit('like-count', result || 0);
  });
  Like.count({mark: markId, owner: userId}, function (err, result) {
    ep.emit('user-liked', result || 0);
  });
};

exports.like = function (markId, userId, callback) {
  Like.findOne({mark: markId, owner: userId}, function (err, result) {
    if (result) {
      return callback();
    }
    var like = new Like();
    like.mark = markId;
    like.owner = userId;
    like.save(callback);
  });
};

exports.dislike = function (markId, userId, callback) {
  Like.remove({mark: markId, owner: userId}, callback);
};