var path = require('path'),
    express = require('express'),
    config = require('./config'),
    routes = require('./routes'),
    utils = require('./lib/utils');

config.upload_dir = config.upload_dir || path.join(__dirname, 'public', 'user_data', 'images');
utils.mkdirp(config.upload_dir);

var app = express();

app.configure(function () {
  app.use(express.bodyParser({
    uploadDir: config.upload_dir
  }));
  app.use(express.cookieParser());
  app.use(express.session({
    secret: config.session_secret
  }));
  
  /*
  var csrf = express.csrf();
  app.use(function (req, res, next) {
    if (req.body && req.body.user_action === 'upload_image') {
      return next();
    }
    csrf(req, res, next);
  });
  */

  var MAX_AGE  = 3600000 * 24 * 30;
  
  app.use('/user_data', express.static(path.join(__dirname, 'public', 'user_data'), {maxAge: MAX_AGE}));

  // routes
  routes(app);

  app.get(/\/$/, utils.csrf, function (req, res, next) {
    if (req.session.user) {
      res.cookie('userinfo', JSON.stringify({
        name: req.session.user.name,
        email: req.session.user.email,
        _csrf: req.session._csrf,
        id: req.session.user._id
      }));
    }
    next();
  });
  app.use('/', express.static(path.join(__dirname, 'public')));
  
  app.configure('production', function () {
    app.use(express.errorHandler());
    app.set('view cache', true);
  });

  app.listen(config.port);
  module.exports = app;

});