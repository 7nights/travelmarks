var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var LikeSchema = new Schema({
  owner: ObjectId,
  mark: ObjectId
});

mongoose.model('Like', LikeSchema);