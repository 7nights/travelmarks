// 修复mark的author类型为ObjectId

var Mark = require('../schemas').Mark,
    User = require('../schemas').User;

Mark.find({}, function (err, marks) {
  if (err) console.log('error occured');
  console.log("marks find: " + marks.length);
  marks.forEach(function (m) {
    var author = m.author.toString();
    m.author = null;
    m.save(function (err, m) {
      m.author = author;
      m.save();
    });
  });
});