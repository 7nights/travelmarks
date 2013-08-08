/**
 * 登录检查
 */
exports.userRequired = function (req, res, next) {
  if (!req.session || !req.session.user) return res.json({status: -1, message: '你需要先登录', code: 'NotSignedIn'});
  next();
};