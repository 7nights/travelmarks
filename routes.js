var sign = require('./controllers/sign'),
    mark = require('./controllers/mark'),
    upload = require('./middlewares/upload'),
    auth = require('./middlewares/auth').userRequired,
    auth_csrf = require('./middlewares/auth').csrf,
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
  app.get('/mark/explore', mark.exploreMarks);
  app.post('/mark/delete', auth, utils.csrf, auth_csrf, mark.deleteMark);

  // item
  app.post('/item/create', auth, mark.createItem);

  // picture
  app.post('/picture/save', auth, upload.uploadImage, mark.savePicture);

  // tag
  app.post('/tag/create', auth, mark.createTag)
};