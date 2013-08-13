var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Mixed = Schema.Types.Mixed,
    ObjectId = Schema.ObjectId;

require('./tag');

var ItemSchema = new Schema({
  markId: {type: ObjectId, index: true},
  author: {type: ObjectId},
  title: String,
  post: String,
  date: {type: Date, default: null},
  tag: {type: ObjectId, ref: 'Tag'},
  pictures: {type: [String]},
  created: {type: Date, default: Date.now}
});

mongoose.model('Item', ItemSchema);