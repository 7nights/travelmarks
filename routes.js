var sign = require('./controllers/sign'),
    mark = require('./controllers/mark'),
    upload = require('./middlewares/upload'),
    auth = require('./middlewares/auth').userRequired,
    utils = require('./lib/utils');

module.exports = function (app) {

  // sign
  app.post('/signup', sign.signUp);
  app.post('/signin', sign.signIn);
  app.get('/signout', utils.csrf, sign.signOut);

  // mark
  app.post('/mark/create', auth, mark.createMark);
  app.get('/mark/get', auth, mark.getMarks);
  app.get('/mark/getMark', mark.getMark);

  // Item
  app.post('/item/create', auth, mark.createItem);

  // picture
  app.post('/picture/save', auth, upload.uploadImage, mark.savePicture);


};