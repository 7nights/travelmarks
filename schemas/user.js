var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    config = require('../config');

var UserSchema = new Schema({
  name: {type: String, unique: true},
  email: {type: String, unique: true},
  avatar: {type: String},
  passwd: {type: String}
});

UserSchema.virtual('avatar_url').get(function () {
  return this.avatar?config.avatar_host + '/public/images/user_' + this.avatar:
    'http://www.gravatar.com/avatar/' + md5(this.email);
});

mongoose.model('User', UserSchema);