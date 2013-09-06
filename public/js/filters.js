'use strict';

/* Filters */

angular.module('myApp.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }]).
  filter('shortNumber', [function () {
    return function (input) {
      input = +input;
      isNaN(input) && (input = 0);
      if (input < 1000) {
        return input;
      } else if (input < 1000000) {
        input /= 1000;
        if (input - parseInt(input) > 0 && input < 100) {
          return input.toFixed(1) + 'k';
        }
        return input + 'k';
      }
    };
  }]);
