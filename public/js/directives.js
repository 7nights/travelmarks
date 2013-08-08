'use strict';

/* Directives */


angular.module('myApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]).
  directive('autoHeightTextarea', function () {
    return function (scope, element, attrs) {
      element[0].addEventListener('input', function (ev) {
        if (ev.target.scrollHeight > ev.target.offsetHeight) {
          var height = $(ev.target).height();
          $(ev.target).height(height + 100);
        }
      });
    };
  });
