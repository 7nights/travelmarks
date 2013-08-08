var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    User = mongoose.model('User');

var MarkSchema = new Schema({
  title: String,
  summary: String,
  date: {type: Date, default: Date.now},
  author: String,
  cover: String,

  latitude: Number,
  longtitude: Number,
  location: String
});
MarkSchema.virtual('coverUrl').get(function (){
  return this.cover || 'img/test.png';
});

mongoose.model('Mark', MarkSchema);