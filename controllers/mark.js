/**
 * Mark相关的请求, 包括item, picture
 */
var User = require('../models').User,
    Mark = require('../models').Mark,
    Item = require('../models').Item,
    Picture = require('../models').Picture,
    check = require('validator').check,
    sanitize = require('validator').sanitize,
    config = require('../config'),
    utils = require('../lib/utils'),
    im = require('imagemagick'),
    path = require('path'),
    fs = require('fs'),
    EventProxy = require('eventproxy');

/**
 * 创建mark请求
 */
exports.createMark = function (req, res, next) {
  if (!req.body.title || !req.body.summary) {
    return res.json({status: -1, message: '请至少填写标题和摘要'});
  }
  try{
    var title = sanitize(sanitize(decodeURIComponent(req.body.title)).trim()).xss().substr(0, 60),
        summary = sanitize(sanitize(decodeURIComponent(req.body.summary)).trim()).xss().substr(0, 3000),
        date = Date.now(),
        author = req.session.user._id,
        latitude = req.body.latitude || '',
        longtitude = req.body.longtitude || '';
        position = decodeURIComponent(req.body.location) || '';
  } catch (e) {
    return res.json({status: -1, message: "非法输入"});
  }
  Mark.create(title, summary, date, author, latitude, longtitude, position, function(err, mark){
    if(err) return next(err);
    res.json({status: 1, message: '创建成功', data: {'markId': mark._id}});
  });
};

/**
 * 获取本人的marks
 */
exports.getMarks = function (req, res, next) {
  var user = req.session.user;
  var ep = EventProxy.create(['getMarks', 'getTotalPictures', 'getTotalMarks'], function (marks, totalPictures, totalMarks) {
    res.json({
      marks: marks,
      totalMarks: totalMarks,
      totalPictures: totalPictures
    });
  });
  Mark.getMarksByAuthor(user._id, {sort: {date: -1}}, function (err, marks) {
    if (err) return next(err);
    marks.forEach(function (o) {
      o.cover = o.coverUrl;
      o.markId = o._id;
      delete o._id;
    });
    ep.emit('getMarks', marks);
  }, 0, 10);
  Mark.countMarksByAuthor(user._id, function (err, val) {
    if (err) return next(err);
    ep.emit('getTotalMarks', val);
  });
  Picture.countPicturesByAuthor(user._id, function (err, val) {
    if (err) return next(err);
    ep.emit('getTotalPictures', val);
  });

};

/**
 * 获取指定的mark
 */
exports.getMark = function (req, res, next) {
  if (!req.param('id')) {
    return res.json({status: -1, message: '请输入完整呀!'});
  }
  var ep = EventProxy.create(['markGot', 'itemsGot', 'usernameGot', function (mark, items, username) {
    var count = 0;
    items.forEach(function (val) {
      count += val.pictures.length;
    });
    var result = {
      title: mark.title,
      location: mark.location,
      read: mark.read || 0,
      author: username,
      summary: mark.summary,
      total: count,
      date: mark.date,
      items: items
    };

    return res.json(result);
  }]);

  function findUser(id) {
    User.getUserById(id, function (err, u) {
      if (err) return next(err);
      ep.emit('usernameGot', u.name);
    });
  }
  Mark.getMarkById(req.param('id'), function (err, m) {
    if (err) return next(err);
    if (!m) return res.json({status: -1, message: '没有找到这个mark!'});
    findUser(m.author);
    ep.emit('markGot', m);
  });
  Item.getMarkItems(req.param('id'), function (err, m) {
    if (err) return next(err);
    if (!m) return res.json({status: -1, message: '没有找到这个mark!'});
    ep.emit('itemsGot', m);
  });
};

/**
 * 创建item请求
 * @param {ObjectId} req.body.markId 目标mark的id
 */
exports.createItem = function (req, res, next) {
  try {
    var markId = req.body.markId,
        post = sanitize(decodeURIComponent(req.body.post)).xss().substr(0, 8000);
  } catch(e) {
    return res.json({status: -1, message: "非法输入"});
  }

  // 验证markId是否存在且为该用户
  Mark.getMarksByQuery({
    _id: markId,
    author: req.session.user._id
  }, function (err, m) {
    if(err) return next(err);
    if(!m || (typeof m === 'array' && m.length === 0)) return res.json({status: -1, message: '没有足够的权限来创建这条景点'});

    Item.createItem(markId, req.session.user._id, post, function(err, it) {
      if(err) return next(err);
      return res.json({status: 1, message: '创建成功', data: {itemId: it._id}});
    });
  });
};

/**
 * 向item添加图片的请求
 * @param {String} req.body.itemId 目标item id
 */
exports.savePicture = function (req, res, next) {
  var file = req.session.lastUploadedImage,
      user_id = req.session.user._id;
  if(!file) return req.json({status: -1, message: '上传文件失败'});

  // 将图片保存到以用户id为名字的文件夹里
  var savepath = path.join(config.upload_dir, user_id, 'pictures');

  var ep = new EventProxy(),
      item;

  Item.getItemById(req.body.itemId, function (err, it) {
    if (err) return next(err);
    if(!it) {
      fs.unlink(file.path, function (err) {
        if (err) return next(err);
      });
      return res.json({status: -1, message: '该景点已经被删除'});
    }
    item = it;

    utils.mkdirp(savepath, function () {
      ep.emitLater('rename');
    });
  });
  var realPath = path.join(savepath, Date.now() + "_" + utils.randomStr(5));
  ep.once('rename', function () {
    fs.rename(file.path, realPath, function (err) {
      if (err) return next(err);
      ep.emitLater('savemodel');
    });
  });

  ep.once('savemodel', function () {
    Picture.savePicture(realPath, file.oriname, 0, user_id, function (err, doc) {
      if (err) return next(err);
      ep.emit('savetoitem', doc);
    });
  });

  ep.once('savetoitem', function (doc) {
    var url;
    if(path.sep === '\\') {
      url = realPath.replace(/\\/g, '/');
    }
    url = url.substr('public/'.length);

    item.pictures.push(url);
    item.save(function (err, result) {
      if (err) return next(err);

      Mark.getMarkById(item.markId, function (err, doc) {
        if (err) return;
        if (!doc.cover) {
          // TODO
          doc.cover = url;
          doc.save();
        }
      });
      return res.json({status: 1, message: '添加图片成功'});
    });
  });

};