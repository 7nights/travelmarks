/**
 * 登录检查
 */
exports.userRequired = function (req, res, next) {
  if (!req.session || !req.session.user) return res.json({status: -1, message: '你需要先登录', code: 'NotSignedIn'});
  next();
};

/**
 * csrf检查
 */
exports.csrf = function (req, res, next) {
  if (req.query._csrf !== req.session._csrf && req.body._csrf !== req.session._csrf) {
    return res.json({status: -1, message: '非法请求', code: 'BadRequest'});
  }
  next();
};