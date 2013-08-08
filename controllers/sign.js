var User = require('../models').User,
    check = require('validator').check,
    sanitize = require('validator').sanitize;

function md5(str) {
  var md5sum = require('crypto').createHash('md5');
  md5sum.update(str);
  return md5sum.digest('hex');
}

var REG_USERNAME = /^[^_]([a-zA-Z0-9\u4e00-\u9fa5]+_?)+[^_]$/;

// sign up
exports.signUp = function (req, res, next) {
  if (!req.body.name || !req.body.passwd || !req.body.repasswd || !req.body.email) {
    return res.json({status: -1, message: '信息不完整'});
  }

  var name = sanitize(req.body.name).trim(),
      pass = sanitize(req.body.passwd).trim(),
      repass = sanitize(req.body.repasswd).trim(),
      email = sanitize(req.body.email).trim(),
      notEnoughInfo = false;

  if (pass === '') notEnoughInfo = true;
  if (pass !== repass) return res.json({status: -1, message: '两次输入的密码不一致'});
  name = sanitize(name).xss();
  pass = md5(sanitize(pass).xss());
  repass = md5(sanitize(pass).xss());
  email = sanitize(email).xss().toLowerCase();

  if (name === '' || email === '') {
    return res.json({status: -1, message: '信息不完整'});
  }

  if (name.length < 5 || name.length > 30) {
    return res.json({status: -1, message: '用户名必须大于5个字符'});
  }

  try {
    check(name).is(REG_USERNAME);
  } catch (e) {
    return res.json({status: -1, message: '用户名非法。用户名只能由数字，字母，中文，不在开头与结尾并且最多连续出现一次的下划线组成。'});
  }

  try {
    check(email, '不正确的电子邮箱。').isEmail();
  } catch(e) {
    return res.json({status: -1, message: e.message});
  }

  User.getUsersByQuery({'$or': [{name: name}, {email: email}]}, {}, function (err, users){
    if (err) return next(err);

    if(users.length > 0){
      if(users[0].name === name) return res.json({status: -1, message: '用户名已被占用。'});
      return res.json({status: -1, message: '邮箱已被占用。'});
    }

    User.createUser(name, email, pass, "", function (err){
      if (err) return next(err);
      res.json({status: 1, message: '创建成功'});
    });
  });
};

// sign in
exports.signIn = function (req, res, next) {
  if (!req.body.name || !req.body.passwd) {
    return res.json({status: -1, message: '信息不完整'});
  }
  var name = sanitize(req.body.name).trim();
  name.indexOf('@') !== -1 && (name = name.toLowerCase());
  var passwd = sanitize(req.body.passwd).trim();

  if (!name || !passwd) return res.json({status: -1, message: '登录信息不完整'});

  User.getUserByQuery({'$or': [{name: name}, {email: name}]}, {}, function(err, user){
    if (err) return next(err);

    if(!user) return res.json({status: -1, message: '没有找到这个用户'});

    passwd = md5(passwd);
    if(passwd !== user.passwd) return res.json({status: -1, message: '密码错误。'});

    req.session.user = user;
    res.cookie('userinfo', JSON.stringify({
      name: user.name,
      email: user.email,
      _csrf: req.session._csrf
    }));
    res.json({status: 1, message: '登录成功'});
  });
};

// sign out
exports.signOut = function (req, res, next) {
  if (req.query._csrf !== req.session._csrf) {
    return res.redirect("/");
  }
  req.session.destroy();
  res.clearCookie('userinfo');
  res.redirect("/");
};