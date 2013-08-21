var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    User = mongoose.model('User'),
    ObjectId = Schema.ObjectId;

var MarkSchema = new Schema({
  title: String,
  summary: String,
  date: {type: Date, default: Date.now},
  author: {type: ObjectId},
  cover: String,
  read: {type: Number, default: 0},

  latitude: Number,
  longtitude: Number,
  location: String
});
MarkSchema.virtual('coverUrl').get(function (){
  return this.cover || 'img/test.png';
});

mongoose.model('Mark', MarkSchema);