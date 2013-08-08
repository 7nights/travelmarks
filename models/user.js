var User = require('../schemas').User;

/**
 * 创建一个用户
 */
exports.createUser = function (name, email, passwd, avatar, callback) {
  var user = new User;
  user.name = name;
  user.email = email;
  user.passwd = passwd;
  user.avatar = avatar;
  user.save(callback);
};

/**
 * 根据email获取一个用户
 * @param {String} email
 * @param {Function} callback 回调函数
 */
exports.getUserByMail = function (email, callback) {
  User.findOne({email: email}, callback);
};

/**
 * 根据id获取用户
 * @param {String} id
 * @param {Function} callback 回调函数
 */
exports.getUserById = function (id, callback) {
  User.findOne({_id: id}, callback);
};

/**
 * 根据用户名获取用户
 * @param {String} name
 * @param {Function} callback
 */
exports.getUserByName = function (name, callback) {
  User.findOne({name: name}, callback);
};

/**
 * 根据条件查询用户
 * @param {String} query 关键字
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
exports.getUserByQuery = function (query, opt, callback) {
  User.findOne(query, {}, opt, callback);
};


exports.getUsersByQuery = function (query, opt, callback) {
  User.find(query, {}, opt, callback);
};