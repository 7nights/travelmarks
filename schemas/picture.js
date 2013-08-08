var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var PictureSchema = new Schema({
  rotate: {type: Number},
  oriname: {type: String},
  author: {type: ObjectId},
  filename: {type: String}
});

mongoose.model('Picture', PictureSchema);