var maps = require('./services/googlemaps');
var https = require('https'),
    colors = require('colors'),
    tunnel = require('tunnel');

maps.PlaceService.textsearch('植物园', function (data) {
  //console.log(data);
  //console.timeEnd('total time used');
}, {});
setTimeout(function(){
  console.time('total time used');
  maps.PlaceService.textsearch('植物园', function (data) {
    console.log(data);
    console.timeEnd('total time used');
  }, {});
}, 2000);
