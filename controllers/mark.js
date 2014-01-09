/**
 * Mark相关的请求, 包括item, picture
 */
var User = require('../models').User,
    Mark = require('../models').Mark,
    Item = require('../models').Item,
    Picture = require('../models').Picture,
    Like = require('../models').Like,
    Tag = require('../models').Tag,
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
    var title = sanitize(sanitize(req.body.title).trim()).xss().substr(0, 60),
        summary = sanitize(sanitize(req.body.summary).trim()).xss().substr(0, 3000),
        date = Date.now(),
        author = req.session.user._id,
        published = !!req.body.published;
  } catch (e) {
    return res.json({status: -1, message: "非法输入"});
  }
  Mark.create(title, summary, date, author, published, function(err, mark){
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
  Mark.getMarksByAuthor(user._id, {sort: {date: -1}}, function(err, marks) {
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
 * explore marks
 * @param {String} req.params.type 可在latest, popular, worldmap, trends, friends等里取值
 * 获取相应的marks
 * @param {String} req.params.offset 分页起点, 以跳过的item数为单位
 */
exports.exploreMarks = function (req, res, next) {
  if (!req.param('type')) {
    return res.json({status: -1, message: '请输入完整呀!'});
  }
  var type = req.param('type');
  if (type === 'friends' && !req.session.user) {
    return res.json({status: -1, message: '请先登录'});
  }
  var offset = req.param('offset') || 0;

  switch(type) {
    case 'latest':
      Mark.getMarksByQuery({published: {$ne: false}}, {skip: offset, limit: 12, sort: {date: -1}}, function (err, marks) {
        if (err) return next(err);
        var done = function () {
          var result = [];
          for (var i = 0, length = marks.length; i < length; i++) {
            var obj = {};
            utils.fillObject(marks[i], obj, ['_id', 'author', 'author_name', 'cover', 'date', 'latitude', 'longtitude', 'location', 'summary', 'title', 'author_avatar']);
            result.push(obj);
          }
          res.json(result);
        };
        var ep = new EventProxy;
        ep.after('userGot', marks.length, done);
        for (var i = marks.length; i--; ){
          (function (j) {
            var author_id = marks[j].author;
            User.getUserById(author_id, function (err, author) {
              if (err) return next(err);
              marks[j].author_avatar = utils.md5(author.email);
              marks[j].author_name = author.name;
              ep.emit('userGot');
            });
          })(i);
        }
      });
  }
};

/**
 * 获取指定的mark
 */
exports.getMark = function (req, res, next) {
  if (!req.param('id')) {
    return res.json({status: -1, message: '请输入完整呀!'});
  }
  var ep = EventProxy.create(['markGot', 'itemsGot', 'userinfoGot', 'likeGot', function (mark, items, userinfo, likeInfo) {
    var count = 0;
    items.forEach(function (val) {
      count += val.pictures.length;
    });
    var result = {
      title: mark.title,
      location: mark.location,
      read: mark.read || 0,
      author: userinfo.name,
      author_avatar: utils.md5(userinfo.email),
      summary: mark.summary,
      total: count,
      date: mark.date,
      items: items,
      author_id: mark.author,
      like_count: likeInfo.count,
      liked: likeInfo.liked,
      published: mark.published
    };

    Mark.increaseRead(req.param('id'));
    return res.json(result);
  }]);

  function findUser(id) {
    User.getUserById(id, function (err, u) {
      if (err) return next(err);
      ep.emit('userinfoGot', {name: u.name, email: u.email});
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
    ep.emit('itemsGot', m);
  });
  var userId;
  if (req.session.user) userId = req.session.user._id;
  Like.getInfo(req.param('id'), userId, function (count, liked) {
    ep.emit('likeGot', {count: count, liked: liked});
  });
};

/**
 * 创建item请求
 * @param {ObjectId} req.body.markId 目标mark的id
 */
exports.createItem = function (req, res, next) {
  if (!req.body.markId || !req.body.tag) {
    return res.json({status: -1, message: '输入不完整'});
  }
  try {
    var markId = req.body.markId,
        post = sanitize(req.body.post).xss().substr(0, 8000),
        title = sanitize(req.body.title).trim(),
        date = req.body.date,
        tag = req.body.tag;
    
    if (date) {
      date = parseInt(date);
      if (isNaN(date)) throw Error('Invalid Date');
      date = new Date(date);
    }
    if (title) {
      title = sanitize(title).xss().substr(0, 100);
    }
  } catch(e) {
    return res.json({status: -1, message: '非法输入'});
  }

  // 验证markId是否存在且为该用户
  Mark.getMarksByQuery({
    _id: markId,
    author: req.session.user._id
  }, function (err, m) {
    if(err) return next(err);
    if(!m || (typeof m === 'array' && m.length === 0)) return res.json({status: -1, message: '没有足够的权限来创建这条景点'});

    Item.createItem(markId, req.session.user._id, title, tag, date, post, function(err, it) {
      if(err) return next(err);
      return res.json({status: 1, message: '创建成功', data: {itemId: it._id}});
    });
  });
};
/**
 * 删除一个mark
 * @param {String} req.post.markId
 */
exports.deleteMark = function (req, res, next) {
  var markId = req.body.markId;
  if (!markId) {
    return res.json({status: -1, message: '非法请求'});
  }
  Mark.removeMarkById(markId, function (err) {
    if (err) return next(err);
    res.json({status: 1, message: '删除成功'});
  });

  // 删除items
  Item.getMarkItems(markId, function (err, items) {
    if (err) return next(err);
    items.forEach(function (it) {
      Picture.deletePictures(it.pictures);
      it.remove();
    });
  });

};
/**
 * 删除一个item
 * @param {String} req.param.itemId
 */
exports.deleteItem = function (req, res, next) {
  var itemId = req.param('itemId');
  if (!itemId) {
    return res.json({status: -1, message: '非法请求'});
  }

  Item.getItemById(itemId, function (err, it) {
    if (err) return next(err);
    if (!it) return res.json({status: -1, message: '没找到这个item'});
    if (it.author != req.session.user._id) return res.json({status: -1, message: '没有足够的权限'});
    Picture.deletePictures(it.pictures);
    it.remove(function (err) {
      if (err) return next(err);
      res.json({status: 1, message: '删除成功!'});
    });
  });
};
/**
 * 删除图片
 */

/**
 * 修改一个mark
 */
exports.alterMark = function (req, res, next) {
  if (!req.body._id) {
    return res.json({status: -1, message: '非法输入'});
  }
  Mark.getMarkById(req.body._id, function (err, m) {
    if (err) return next(err);
    if (!m) return res.json({status: -1, message: ''});
    if (m.author != req.session.user._id) return res.json({status: -1, message: '没有足够的权限'});

    if (req.body.cover) {
      var cover = sanitize(req.body.cover).xss();
      m.cover = cover;
    }
    var title;
    if (req.body.title && (title = sanitize(sanitize(req.body.title).xss()).trim().substr(0, 100))) {
      m.title = title;
    }
    var summary;
    if (req.body.summary && (summary = sanitize(sanitize(req.body.summary).xss()).trim().substr(0, 3000))) {
      m.summary = summary;
    }
    var published;
    if (req.body.published !== undefined) {
      m.published = !!req.body.published;
    }
    m.save(function (err) {
      if (err) return next(err);
      return res.json({status: 1, message: '修改成功!'});
    });
  });
};

/**
 * 修改一个item
 * @param {String} req.body._id item id
 * @param {String} req.body.post
 * @param {Object} req.body.tag
 * @param {String} req.body.title
 * @param {Array} req.body.pictures
 * @param {Number} req.body.date
 */
exports.alterItem = function (req, res, next) {
  if (!req.body._id) {
    return res.json({status: -1, message: '非法请求'});
  }
  Item.getItemById(req.body._id, function (err, it) {
    if (err) return next(err);
    if (!it) return res.json({status: -1, message: '此item不存在'});

    if (it.author != req.session.user._id) res.json({status: -1, message: '没有权限'});

    if (req.body.post) {
      var post = sanitize(req.body.post).xss().substr(0, 5000);
      it.post = post;
    }
    if (req.body.tag) {
      var tag = req.body.tag;
      it.tag = tag;
    }
    if (req.body.title) {
      var title = sanitize(sanitize(req.body.title).xss()).trim().substr(0, 100);
      it.title = title;
    }
    if (req.body.pictures && req.body.pictures.constructor === Array) {
      var oldPictures = it.pictures,
          pictures = req.body.pictures;
      // find deleted pictures
      var deleted = [];
      oldPictures.forEach(function (val, i) {
        if (pictures.indexOf(val) === -1) {
          deleted.push(val);
        }
      });
      it.pictures = pictures;
      Picture.deletePictures(deleted);
    }
    if (req.body.date) {
      var date = new Date(req.body.date);
      if (isNaN(date.getTime())) date = new Date();
      it.date = date;
    }
    it.save(function () {
      res.json({status: 1, message: '修改成功!'});
    });
  });
};
/**
 * 向item添加图片的请求
 * @param {String} req.body.itemId 目标item id
 * @param {String} req.body.type 'base64' || 'file'
 */
exports.savePicture = function (req, res, next) {
  var file = req.lastUploadedImage,
      user_id = req.session.user._id,
      oriname;
  req.lastUploadedImage = null;
  if (!file && req.body.type !== 'base64') return res.json({status: -1, message: '上传文件失败'});
  if (!file && req.body.type === 'base64' && !req.body.image) {
    return res.json({status: -1, message: '上传文件失败'});
  }

  // 将图片保存到以用户id为名字的文件夹里
  var savepath = path.join(config.upload_dir, user_id, 'pictures');

  var ep = new EventProxy(),
      item;

  Item.getItemById(req.body.itemId, function (err, it) {
    if (err) return next(err);
    if(!it && file) {
      fs.unlink(file.path, function (err) {
        if (err) return next(err);
      });
      return res.json({status: -1, message: '该景点已经被删除'});
    }
    item = it;

    utils.mkdirp(savepath, function (err) {
      ep.emitLater('rename');
    });
  });
  var realPath = path.join(savepath, Date.now() + "_" + utils.randomStr(5));
  var url;
  if(path.sep === '\\') {
    // for windows
    url = realPath.replace(/\\/g, '/');
  } else {
    url = realPath;
  }
  url = url.substr('public/'.length);

  ep.once('rename', function () {
    if (req.body.type === 'base64') {
    // 如果类型为base64转码并写入文件
      oriname = req.body.oriname;
      var buf = new Buffer(req.body.image, 'base64');
      fs.writeFile(realPath, buf, function (err) {
        if (err) return next(err);
        ep.emitLater('savemodel');
      });
      if (file) {
        fs.unlink(file.path, function (err) {
          if (err) return next(err);
        });
      }
    } else {
    // 如果类型为file则直接重命名临时文件
      oriname = file.oriname;
      fs.rename(file.path, realPath, function (err) {
        if (err) return next(err);
        ep.emitLater('savemodel');
      });
    }
  });

  ep.once('savemodel', function () {
    Picture.savePicture(url, oriname, 0, user_id, function (err, doc) {
      if (err) return next(err);
      ep.emit('savetoitem', doc);
    });
  });

  ep.once('savetoitem', function (doc) {

    if(!req.body.insertPos) {
      item.pictures.push(url);
    } else {
      var index = parseInt(req.body.insertPos);
      if (isNaN(index)) {
        item.pictures.push(url);
      } else {
        item.pictures.splice(index, 0, url);
      }
    }
    item.save(function (err, result) {
      if (err) return next(err);

      Mark.getMarkById(item.markId, function (err, doc) {
        if (err) return;
        // TODO cover
        if (1 || !doc.cover) {
          // TODO
          doc.cover = url;
          doc.save();
        }
      });
      return res.json({status: 1, message: '添加图片成功', data: {url: url}});
    });
  });

};
/**
 * 创建一个标签
 * @param {String} req.body.markId markId
 * @param {String} req.body.name
 * @param {String} req.body.addr
 * @param {Number} req.body.lat
 * @param {Number} req.body.lng
 */
exports.createTag = function (req, res, next) {
  if (!req.body.markId || !req.body.name || !req.body.addr || !req.body.lat || !req.body.lng) return res.json({status: -1, message: '非法请求'});
  var markId = req.body.markId,
      name = sanitize(sanitize(req.body.name).xss()).trim().substr(0, 60),
      addr = sanitize(sanitize(req.body.addr).xss()).trim().substr(0, 255),
      lat = parseFloat(req.body.lat),
      lng = parseFloat(req.body.lng);
  Mark.getMarkById(markId, function (err, m) {
    if (err) return next(err);
    if (!m) return res.json({status: -1, message: '此mark已经不存在'});

    Tag.createTag(markId, name, addr, lat, lng, function (err, tag) {
      return res.json({status: 1, message: '成功', data: {tagId: tag._id}});
    });
  });
};

/**
 * 对一个mark标记喜欢
 * @param {ObjectId} req.params.markId
 */
exports.like = function (req, res, next) {
  if (!req.param('markId')) return res.json({status: -1, message: '非法输入'});
  Like.like(req.param('markId'), req.session.user._id, function () {
    res.json({status: 1, message: '标记喜欢成功!'});
  });
};

/**
 * 取消对一个mark的喜欢
 */
exports.dislike = function (req, res, next) {
  if (!req.param('markId')) return res.json({status: -1, message: '非法输入'});
  Like.dislike(req.param('markId'), req.session.user._id, function () {
    res.json({status: 1, message: '取消喜欢成功!'});
  });
};