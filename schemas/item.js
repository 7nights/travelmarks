var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var ItemSchema = new Schema({
  markId: {type: ObjectId, index: true},
  author: {type: ObjectId},
  post: String,
  date: {type: Date, default: Date.now},
  pictures: {type: [String]}
});

mongoose.model('Item', ItemSchema);