var https = require('https');
var tunnel = require('tunnel');
var config = require('../config');
var API_KEY = config.API_KEY;
var PlaceService = {};

function sendRequest(url, callback, proxy) {
  var body = '';
  if (!proxy) {
    http.get(url + '&sensor=false&key=' + API_KEY, function (res) {
      res.setEncoding('utf-8');
      res.on('data', function (d) {
        body += d;
      });
      res.on('end', function () {
        callback(JSON.parse(body));
      });
    }).
    on('error', function (e) {
      console.error(e);
    });
    return;
  }
  var tunnelingAgent = tunnel.httpsOverHttp({
    proxy: {
      hostname: proxy.host || 'web-proxyhk.oa.com',
      port: proxy.port || '8080'
    }
  });

  var req = https.request({
    method: 'GET',
    hostname: 'maps.googleapis.com',
    port: 443,
    path: url + '&sensor=false&key=' + API_KEY,
    agent: tunnelingAgent
  }, function (res) {
    res.setEncoding('utf-8');
    res.on('data', function (d) {
      body += d;
    });
    res.on('end', function () {
      callback(JSON.parse(body));
    });
  });
  req.end();
}
/**
 * @param {String} query it sholud be called with encodeURIComponent
 * @param {Function } callback(Object data)
 */
PlaceService.textsearch = function (query, callback, proxy) {
  sendRequest('https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + encodeURIComponent(query), callback, proxy);
};
PlaceService.autocomplete = function (query, callback, proxy) {
  sendRequest('https://maps.googleapis.com/maps/api/place/autocomplete/json?input=' + encodeURIComponent(query), callback, proxy);
};
PlaceService.getdetails = function (query, callback, proxy) {
  sendRequest('https://maps.googleapis.com/maps/api/place/details/json?reference=' + encodeURIComponent(query), callback, proxy);
};

exports.PlaceService = PlaceService;