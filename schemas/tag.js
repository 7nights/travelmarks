var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Mixed = Schema.Types.Mixed,
    ObjectId = Schema.ObjectId;

var TagSchema = new Schema({
  markId: {type: ObjectId, index: true},
  name: String,
  addr: String,
  lat: Number,
  lng: Number
});

mongoose.model('Tag', TagSchema);