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
      function resize(ev) {
        var diff = ev.target.scrollHeight - ev.target.offsetHeight;
        if (diff > 0) {
          var height = $(ev.target).height();
          $(ev.target).height(height + diff);
        }
      }
      element[0].addEventListener('input', resize);
      element[0].addEventListener('click', resize);
      element[0].addEventListener('blur', function (ev) {
        $(ev.target).height(65);
      });
    };
  }).
  directive('autoCompletePlaces', ['$http', function ($http) {
    var styleSheet = document.createElement('style');
    styleSheet.innerHTML = '.auto-complete-places-container{position: absolute;display: none;}';
    document.getElementsByTagName('head')[0].appendChild(styleSheet);

    return function (scope, element, attrs) {
      var e = element[0];
      e.placeholder = 'input a place';
      var resultsBox = document.createElement('div');
      resultsBox.className = 'auto-complete-places-container';
      document.body.appendChild(resultsBox);
      var req = new google.maps.places.AutocompleteService();
      var throttle_t,
          throttle_count,
          THROTTLE_CD = 300;
          
      function sendRequest() {
        var bounds = e.getBoundingClientRect(),
            val = e.value;
        if (!val) return;
        req.getQueryPredictions({
          input: val
        }, function (arr, st) {
          resultsBox.style.top = bounds.bottom + 'px';
          resultsBox.style.left = bounds.left + 'px';
          resultsBox.style.display = 'block';
          resultsBox.innerHTML = '';
          for (var i = 0, length = arr.length; i < length; i++){
            var div = document.createElement('div');
            div.innerHTML = arr[i].description;
            resultsBox.appendChild(div);
          }
        });
      }
      
      e.addEventListener('input', function (ev) {
        var val = e.value;
        if (!val) {
          return resultsBox.style.display = 'none';
        }
        if (throttle_t) {
          return throttle_count = THROTTLE_CD;
        } else {
          throttle_count = THROTTLE_CD;
          throttle_t = setInterval(function () {
            throttle_count -= 20;
            if (throttle_count <= 0) {
              clearInterval(throttle_t);
              throttle_t = null;
              sendRequest();
            }
          }, 20);

        }
        sendRequest();

      }, false);
    };
  }]).
  directive('customSelect', ['$compile', function ($compile) {
    return function (scope, element, attrs) {
     var options = scope.$eval(attrs.options);
     var ul = document.createElement('ul');
     ul.className = 'custom-select-list';
     var displayBox = document.createElement('div');
     displayBox.className = 'custom-select-selected';
     var list = [];
     element[0].appendChild(displayBox);
     element[0].appendChild(ul);
     options.forEach(function (val) {
      var e = document.createElement('li');
      e.innerHTML = val.value;
      e.dataset.optionCode = val.code;
      ul.appendChild(e);
      e.addEventListener('click', function () {
        scope[attrs.selectModel] = val;
        scope.$digest();
        displayBox.innerHTML = val.value;
      });
     });
     var ds = attrs.defaultSelect || 0;
     displayBox.innerHTML = options[ds].value;
     scope[attrs.selectModel] = options[ds];
    };
  }]).
  directive('loadingAnimation', [function () {
    return function (scope, element, attrs) {

    };
  }]);
