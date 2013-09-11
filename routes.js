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
  app.post('/mark/alter', auth, mark.alterMark);
  app.get('/mark/like', auth_csrf, mark.like);
  app.get('/mark/dislike', auth_csrf, mark.dislike);

  // item
  app.post('/item/create', auth, mark.createItem);
  app.post('/item/alter', auth, mark.alterItem);
  app.get('/item/delete', auth, mark.deleteItem);

  // picture
  app.post('/picture/save', auth, upload.uploadImage, mark.savePicture);
  app.post('/picture/save/base64', auth, mark.savePicture);

  // tag
  app.post('/tag/create', auth, mark.createTag);
};