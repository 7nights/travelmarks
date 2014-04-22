'use strict';

window.Utils = {
  cookies: {
    get: function (key) {
      if (document.cookie.length > 0) {
        var start = document.cookie.indexOf(key + '=');
        if (start !== -1) {
          start += key.length + 1;
          var end = document.cookie.indexOf(';', start);
          if (end === -1) end = document.cookie.length;
          return unescape(document.cookie.substr(start, end));
        }
      }
      return null;
    },
    set: function (key, value, expires) {
      document.cookie = key + "=" + escape(value) + 
      (!expires ? '' : ';expires=' + new Date(Date.now() + expires).toUTCString());
    },
    remove: function (key) {
      this.set(key, '', -3600);
    }
  },
  syncQueue: (function () {
    function syncQueue() {
      this._queue = [];
      this._index = 0;
    }
    syncQueue.prototype = {
      push: function (fn){
        this._queue.push(fn);
        return this;
      },
      exec: function (args){
        var next = function (err, args) {
          next.index++;
          if(next.index >= next.queue.length) return;
          if(err) {
            while(next.index < next.queue.length) {
              if(next.queue[next.index] && next.queue[next.index].length === 3) {
                return next.queue[next.index](err, args, next);
              }
              next.index++;
            }
            throw err;
          } else {
            var argLength = next.queue[next.index].length;
            if(argLength === 2) {
              next.queue[next.index](args, next);
            } else if(argLength === 3) {
              next.queue[next.index](null, args, next);
            }
          }
        };
        next.index = -1;
        next.queue = this._queue;
        next(null, args);
      }
    };
    return syncQueue;
  })()
};

/**
 * HashManager 提供对地址中的hash的控制
 */
angular.module('HashManager', []).provider('HashManager', function(){
  console.log('load HashManager');
  var listeners = [];
  var other = null,
      currentArgs = {},
      disableHandler = false;

  this.addListener = function(url, fn, priority){
    if(priority === undefined){
      priority = 0;
    }
    var partReg = /:([^\/]*)/g,
    result = partReg.exec(url),
    args = [];
    while(result !== null){
      args.push(result[1]);
      result = partReg.exec(url);
    }
    var urlReg = url.replace(partReg, "([^\/]*)");
    var obj = {
      "urlReg" : "^" + urlReg + "$",
      "args" : args,
      "function" : fn,
      "priority" : priority
    };
    var flag = false;
    for(var i = 0, length = listeners.length; i < length; i++){
      if(listeners[i].priority < priority){
        listeners.splice(i, 0, obj);
        flag = true;
      }
    }
    if(!flag) listeners.push(obj);
    return this;
  };
  this.other = function(fn){
    other = fn;
  };
  this.slience = function() {
    disableHandler = true;
  };
  this.$get = function(){
    var self = this;
    return {
      /**
       * @param {String} url 关注的地址
       * @param {Function} fn 回调函数
       * @param {Number} priority 优先级
       */
      addListener: function(a, b, c){
        self.addListener(a, b, c);
        return this;
      },
      /**
       * 获取当前地址中的参数(地址必须先注册), 例如注册地址"article/:articleId", 在访问
       "#article/325" 时即可获得{articleId: "325"}
       * @return {Object} 地址中的参数
       */
      getArgs: function(){
        return currentArgs;
      },
      /**
       * 注册一个默认监听器, 当遇到一个没有被侦听的地址时, 将会调用这个监听器
       * @param {Function} fn 回调函数
       */
      other: self.other,
      slience: function(){
        disableHandler = true;
      }
    };
  };

  var handleHash = function(e){
    if(disableHandler) return disableHandler = false;

    for(var i = 0, length = listeners.length; i < length; i++){
      var reg = new RegExp(listeners[i]["urlReg"]),
      hash = window.location.hash;
      if(hash[0] === '#') hash = hash.substr(1);
      var result = hash.match(reg);
      if(result !== null){
        var args = {};
        for(var j = 1; j <= listeners[i]["args"].length; j++){
          args[listeners[i]["args"][j - 1]] = result[j];
        }
        currentArgs = args;
        listeners[i]["function"](args);
        return;
      }
    }
    if(other !== null){
      currentArgs = [];
      other();
    }
  };
  window.addEventListener("hashchange", handleHash);
  window.addEventListener("load", handleHash);
});


/* Services */
angular.module('myApp.services', ['ng', 'HashManager', 'ngSanitize']).
  value('version', '0.1').
  provider('lazyLoad', function () {
    var mod = {};
    var windowLoaded = false;
    var _methods = {
      define: function (mods) {
        mods.forEach(function (val) {
          mod[val.name] = {
            url: val.url,
            loaded: false,
            loading: false,
            type: val.type || 'js'
          };
        });
      },
      exec: function (requires, callback) {
        // 检查模块是否已经被载入过
        requires.forEach(function (val) {
          if (!mod[val].loading && !mod[val].loaded) {
            mod[val].loading = true;
            loadMod(val);
          }
        });
        // 等待所有模块载入完毕后执行
        var t = setInterval(function () {
          var loaded = true;
          for (var i = requires.length; i--; ) {
            if (!mod[requires[i]].loaded) {
              loaded = false;
              break;
            }
          }
          if (loaded) {
            callback();
            clearInterval(t);
          }
        }, 100);
      }
    };
    function loadMod(modName) {
      if (!windowLoaded) {
        setTimeout(function () {
          loadMod(modName);
        }, 100);
        return;
      }
      mod[modName].loading = true;
      var dom;
      switch(mod[modName].type) {
        case 'js':
          dom = document.createElement('script');
          dom.onload = function () {
            mod[modName].loaded = true;
          }
          dom.src = mod[modName].url;
          break;
      }
      document.querySelector('head').appendChild(dom);
    }
    window.addEventListener('load', function () {
      windowLoaded = true;
    });
    this.$get = function () {
      return _methods;
    };
  }).
  provider('DISQUS', function () {
    var init = false;
    this.$get = function () {
      return {
        reset: function () {
          var self = this;
          if (!init || !window.DISQUS) {
            return setTimeout(function () {
              self.reset();
            }, 200);
          }
          DISQUS.reset({
            reload: true,
            config: function () {
              this.page.identifier = window.location.hash;
              this.page.url = 'http://' + window.location.host + '#!' + window.location.hash.substr(1);
            }
          });
        },
        init: function (e) {
          init = true;
          e.innerHTML = '<div id="disqus_thread"></div><noscript>Please enable JavaScript to view the <a href="http://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript><a href="http://disqus.com" class="dsq-brlink">comments powered by <span class="logo-disqus">Disqus</span></a>';
          eval('var disqus_shortname = "travelmarks";var disqus_identifier = "newidentifier";var disqus_url = "http://www.example.com";(function() {var dsq = document.createElement("script"); dsq.type = "text/javascript"; dsq.async = true;dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";(document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(dsq);})();');
        }
      };
    };
  }).
  provider('area', function () {
    var oAreas = {};
    /*
     * area(name, description, scope)
     * area(name, scope)
     * area(name) return an area's exports
     * area(scope) execute scope
     */
    function area(name, description, scope) {
      if (arguments.length === 1 && typeof arguments[0] === 'string') { // get area exports
        return oAreas[name];
      } else if (arguments.length === 2) { // omit description
        scope = description;
        description = undefined;
      }
      var exports = {};
      scope(exports);
      typeof name === 'string' && (oAreas[name] = exports);
    };
    this.$get = function () {
      return area;
    };
  }).
  provider('Loading', function () {
    var count = 0;
    var _methods = {
      start: function () {
        count ++;
        checkCount();
      },
      end: function () {
        count --;
        checkCount();
      }
    };
    function checkCount() {
      if (count > 0) {
        document.querySelector('.global-loading').style.display = 'block';
      } else {
        count = 0;
        document.querySelector('.global-loading').style.display = 'none';
      }
    }
    this.$get = function () {
      return _methods;
    };
  }).
  provider('User', function () {
    var scope;
    angular.injector(['ng']).invoke(['$rootScope', function($rootScope, version){
      scope = $rootScope.$new();
      scope.eatCookie = function () {
        var cookies = Utils.cookies;
        var user = JSON.parse(cookies.get('userinfo'));
        if(!user) {
          return false;
        }
        scope.name = user.name;
        scope.email = user.email;
        scope._csrf = user._csrf;
        scope.id = user.id;
        cookies.remove('userinfo');
        scope.$digest();

        return true;
      };
      scope.eatCookie.$inject = ['cookie'];
    }]);

    this.$get = function(){
      return scope;
    };
  }).
  provider('Util', function(){
    var notice = function(){
      var ele = angular.element("<div ng-show='visible' class='alert notice'><button type='button' class='close' ng-click='close()'>×</button><span>{{msg}}</span></div>"),
          ele2 = angular.element("<div ng-show='visible' class='tooltip bottom fade in'><div class='tooltip-arrow'></div><div class='tooltip-inner' ng-bind-html='tooltip'></div></div>"),
          scope,
          scope2,
          compile;
      angular.injector(['ng', 'ngSanitize']).invoke(["$rootScope", '$compile', '$sanitize', function($rootScope, $compile, $sanitize){
        scope = $rootScope.$new();
        scope2 = $rootScope.$new();
        compile = $compile;
      }]);

      scope.close = function(){
        scope.visible = false;
      };

      scope.visible = false;
      scope2.visible = false;

      var clonedElement = compile(ele)(scope, function(clonedElement, scope){
        document.body.appendChild(clonedElement[0]);
      });

      var tooltip = compile(ele2)(scope2, function(tooltip, scope2){
        document.body.appendChild(tooltip[0]);
      });

      var startTimer = function(s){
        if(s.timer){
          return;
        }
        s.timer = setInterval(function(){
          s.ttl = s.ttl - 100;
          if(s.ttl <= 0){
            clearInterval(s.timer);
            s.ttl = 0;
            s.timer = null;
            s.visible = false;
            s.$digest();
          }
        }, 100);
      };


      return function(msg, duration, _tooltip) {
        if (msg === null) {
          scope.ttl = 0;
          scope2.ttl = 0;
          return;
        }
        if(_tooltip){
          scope2.ttl = duration || 5000;
          startTimer(scope2);
          scope2.tooltip = msg;
          scope2.visible = true;
          scope2.$digest();
          var offset = $(_tooltip).offset(),
              bounds = {
                height: _tooltip.offsetHeight
              };
          tooltip[0].style.position = "absolute";
          tooltip[0].style.left = offset.left + "px";
          tooltip[0].style.top = offset.top + bounds.height + "px";
        } else {
          scope.ttl = duration || 5000;
          startTimer(scope);
          scope.msg = msg;
          //clonedElement[0].style.display = "block";
          clonedElement[0].style.left = (innerWidth - clonedElement[0].offsetWidth) / 2 + 'px';
          scope.visible = true;
          scope.$digest();
          clonedElement[0].style.left = (window.innerWidth - clonedElement[0].offsetWidth) / 2 + "px";
        }
      };
    }();

    var getDatePicker = function (d, callback) {
      var container = document.createElement('div'),
            title = document.createElement('div');
      if(!d){
        d = new Date();
      }
      function _getPickerTable(d) {
        if(!d){
        d = new Date();
        }
        var now = d,
            year = now.getFullYear(),
            month = now.getMonth(),
            day = now.getDay(),
            date = now.getDate(),
            daysAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            dateLength = [31, (year%4===0?29:((year%100===0&&year%400===0)?29:28)), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
            table,
            firstDay = new Date(year, month, 1).getDay(),
            nowDay = firstDay,
            nowTr = document.createElement("tr"),
            TODAY_CLASS = 'cal-today',
            TITLE_CLASS = 'cal-title',
            CLOSE_CLASS = 'cal-close',
            FIRST_LINE_CLASS = "cal-first-line";
            
        title.className = TITLE_CLASS;
        title.innerHTML = title.innerHTML = '<span class="cal-btn"><i data-pre="true" class="icon-chevron-left icon-white"></i></span><span class="cal-title-text">' + d.getFullYear() + ', ' + (d.getMonth() + 1) + '</span><span class="cal-btn"><i data-next="true" class="icon-chevron-right icon-white"></i></span><span class="' + CLOSE_CLASS + ' cal-btn"><i class="icon-remove icon-white" data-close="true"></i></span>';
        table = document.createElement("table");
        nowTr.className = "cal-firstTr";
        for(var i = 0; i < 7; i++){ // 日历标题
          nowTr.innerHTML += "<th class='"+FIRST_LINE_CLASS+"'>" + daysAbbr[i] + "</th>";
        }
        table.appendChild(nowTr);
        nowTr = document.createElement("tr");
        for(var i = 0; i < nowDay; i++){ // 日历第一行前面空格
          nowTr.innerHTML += "<td></td>";
        }
        for(var i = 1, length = dateLength[month]; i <= length; i++){ // 日历剩下部分
          if( i === date && d.getMonth() === new Date().getMonth() ){
            nowTr.innerHTML += "<td class='" + TODAY_CLASS + "'>" + i + "</td>";
          } else {
            nowTr.innerHTML += "<td>" + i + "</td>";
          }
          if(nowDay === 6){
            nowDay = 0;
            table.appendChild(nowTr);
            nowTr = document.createElement("tr");
            continue;
          }
          nowDay++;
        }
        if (nowDay !== 0) {
          for(var i = nowDay; i <= 6; i++){
            nowTr.innerHTML += "<td></td>";
          }
        }
        table.appendChild(nowTr);
        return table;
      }

      title.addEventListener('click', function (ev) {
        var i = ev.target;

        if (i.tagName !== 'I' && !$(i).hasClass('cal-btn')) return;
        $(i).hasClass('cal-btn') && (i = i.childNodes[0]);

        if (i.dataset.pre == 'true') {
          d.setMonth(d.getMonth() - 1);
        } else if (i.dataset.next === 'true'){
          d.setMonth(d.getMonth() + 1);
        } else if (i.dataset.close === 'true') {
          callback(null);
          container.parentNode.removeChild(container);
        }
        var t = container.getElementsByTagName('TABLE')[0];
        t.parentElement.removeChild(t);
        t = _getPickerTable(d);
        bindClickEvent(t);
        container.appendChild(t);
        title.getElementsByClassName('cal-title-text')[0].innerHTML = d.getFullYear() + ', ' + (d.getMonth() + 1);
      }, false);
      
      function bindClickEvent(t) {
        t.addEventListener('click', function (ev) {
          var td = ev.target;
          if (td.tagName !== 'TD') return;
          if (td.innerHTML === '') return;

          callback(new Date(d.setDate(+td.innerHTML)));
        }, false);
      }

      var table = _getPickerTable(d);
      bindClickEvent(table);
      container.appendChild(title);
      container.appendChild(table);
      return container;
    };

    /**
     * 遮罩
     * enable: 是否开启遮罩
     * what: 遮罩的标志，通过标志可以管理遮罩
     * clear: 哪些元素不在遮罩之下, 数组
     * plexi(enable, [what='PLEXI'], [zIndex=1000], [clear])
     * plexi.push([zIndex], [clear])
     * plexi.remove()
     */
    var plexi = function () {
      var template = '<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, .5); display: none; "></div>';
      var plexiDiv = angular.element(template)[0];
      document.body.appendChild(plexiDiv);

      var whats = [],
          whats_clear = [],
          plexies = [];
      var _method = function (enable, what, zIndex, clear) {
        if (arguments.length < 3) {
          zIndex = what;
          what = 'PLEXI';
        }
        zIndex = zIndex || 1000;
        zIndex > 0 && (plexiDiv.style.zIndex = zIndex);
        if (what && enable && whats.indexOf(what) === -1) {
          whats.push(what);
          whats_clear[what] = clear;
        }
        if (what && !enable) {
          var tmp = whats.splice(whats.indexOf(what), 1)[0];
          whats_clear[tmp].forEach(function (val) {
            val.classList.remove(_method.CLEAR_CLASS);
          });
          delete whats_clear[tmp];
        }
        if (whats.length > 0) {
          plexiDiv.style.display = 'block';
        } else {
          plexiDiv.style.display = 'none';
        }
        if (clear && clear.constructor === Array) {
          clear.forEach(function (val) {
            val.classList.add(_method.CLEAR_CLASS);
          });
        }
      };
      _method.CLEAR_CLASS = 'clear-plexi';
      _method.push = function (zIndex, clear) {
        var e = angular.element(template)[0];
        e.style.display = 'block';
        e.style.zIndex = zIndex || 1000;
        document.body.appendChild(e);
        if (clear && clear.constructor === Array) {
          clear.forEach(function (val) {
            val.classList.add(_method.CLEAR_CLASS);
          });
        }
        plexies.push({
          plexi: e,
          clear: clear
        });
      };
      _method.remove = function () {
        var it = plexies.pop();
        if (!it) return;
        it.plexi.parentNode.removeChild(it.plexi);
        it.clear.forEach(function (val) {
          val.classList.remove(_method.CLEAR_CLASS);
        });
      };

      return _method;
    }();

    /**
     * 图片压缩
     */
    var getCompressedImage = function (img, quality, type) {
      var image,
          canvas,
          ctx;
      if (!type) {
        type = 'image/jpeg';
      }
      if (typeof img === 'string') {
        image = new Image();
        image.src = img;
        if (!image.complete) {
          alert('Please enable browser cache!');
          return null;
        }
      }
      switch(quality) {
        case 2: // original
          return img;
        case 0: // high <= 1440
          var height = image.height,
              width = image.width;
          if (height >= width && height > 1440) {
            var scale = height / 1440;
            height = 1440;
            width /= scale;
          } else if (width > height && width > 1440) {
            var scale = width / 1440;
            height /= scale;
            width = 1440;
          }
          canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, width, height);
          if (type === 'image/jpeg') {
            return canvas.toDataURL(type, .75);
          }
          return canvas.toDataURL(type);
        case 1: // good <= 1024
          var height = image.height,
              width = image.width;
          if (height >= width && height > 1024) {
            var scale = height / 1024;
            height = 1024;
            width /= scale;
          } else if (width > height && width > 1024) {
            var scale = width / 1024;
            height /= scale;
            width = 1024;
          }
          canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, width, height);
          if (type === 'image/jpeg') {
            return canvas.toDataURL(type, .75);
          }
          return canvas.toDataURL(type);
      }
    };

    /**
     * 自定义的alert窗口
     */
    var _alert = function () {
      var scope, compile;
      var alertType = 'panel'; // 'alert' || 'comfirm'
      var pendingAlert = [];
      var currentAlert;
      angular.injector(['ng', 'ngSanitize']).invoke(['$rootScope', '$compile', '$sanitize', function ($rootScope, $compile, $sanitize) {
        scope = $rootScope;
        compile = $compile;
        scope.show = false;
        scope.getComponent = function (type) {
          switch(type) {
            case 'buttons':
              if (alertType === 'alert' || alertType === 'confirm') return true;
              if (alertType === 'panel') return false;
              break;
            case 'cancelable':
              if (alertType === 'confirm') return true;
              return false;
            case 'title':
              if (!scope.title) return false;
              return true;
          }
        };
        scope.cancel = function () {
          typeof currentAlert.oncancel === 'function' && currentAlert.oncancel();
          closeAlert();
        };
        scope.ok = function () {
          typeof currentAlert.onok === 'function' && currentAlert.onok();
          closeAlert();
        };
      }]);
      var ele = angular.element('<div class="custom-alert"><div ng-show="getComponent(\'title\')" class="custom-alert-title" ng-bind-template="{{title}}"></div><div ng-bind-html="alertMessage" class="custom-alert-messageBody"></div><div class="custom-alert-buttons" ng-show="getComponent(\'buttons\')"><button ng-click="cancel()" ng-show="getComponent(\'cancelable\')" class="custom-btn-cancel btn-success btn">Cancel</button><button class="custom-btn-ok btn-info btn" ng-click="ok()">OK</button></div></div>'),
      filter = angular.element('<div ng-show="show" class="custom-alert-filter" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;"></div>');
      filter = compile(filter)(scope, function(ele) {
        document.body.appendChild(ele[0]);
      });
      var clonedElement = compile(ele)(scope, function (clonedElement, scope) {
        document.body.appendChild(clonedElement[0]);
      });


      function closeAlert() {
        var height = clonedElement[0].offsetHeight;
        clonedElement[0].style.top = - height - 10 + 'px';
        scope.show = false;
        typeof currentAlert.onclose === 'function' && currentAlert.onclose();
        try {
          scope.$digest();
        } catch (e) {}
      }

      function AlertCtrl() {
        this._id = parseInt(Math.random() * 100000);
        this.showed = false;
      }
      AlertCtrl.prototype.close = closeAlert;

      function showAlert(title, msg, type) {
        scope.title = title;
        if (!type) type = 'alert';
        alertType = type;
        var obj = pendingAlert.shift();
        obj.showed = true;
        currentAlert = obj;
        scope.show = true;
        scope.alertMessage = msg;
        scope.$digest();
        clonedElement[0].style.top = - clonedElement[0].offsetHeight - 10 + 'px';
        clonedElement[0].style.display = 'block';
        setTimeout(function () {
          clonedElement[0].style.top = '0';
        });
      }

      /*
       * Util.alert
       * 显示alert窗口
       * 调用此函数返回一个对象,设置这个对象的onclose, oncancel, onok属性可监听事件
       * 此对象还有一个close函数可调用, 用来关闭alert窗口
       */
      return function (title, msg, type) {
        var obj = new AlertCtrl();
        pendingAlert.push(obj);

        if (!scope.show) showAlert(title, msg, type);

        return obj;
      };
    }();

    var settings = function () {
      var NAMESPACE = 'jxoq532nm#$d';
      var listeners = [];
      var storage = {
        get: function () {
          if (!localStorage[NAMESPACE + '_settings']) {
            return {};
          } else {
            return JSON.parse(localStorage[NAMESPACE + '_settings']);
          }
        },
        set: function (obj) {
          localStorage[NAMESPACE + '_settings'] = JSON.stringify(obj);
        }
      };
      var handleListeners = function (key, newValue) {
        var oldValue = storage.get()[key];
        listeners.forEach(function (val) {
          if (val.key === key) {
            var stop = val.callback(key, oldValue, newValue);
            if (stop) return true;
          }
        });
      };
      var _methods = {
        set: function (key, value) {
          var stop = handleListeners(key, value);
          if (stop) {
            return false;
          }
          var obj = storage.get();
          obj[key] = value;
          storage.set(obj);
          return true;
        },
        get: function (key, _default) {
          var obj = storage.get();
          return obj[key] || _default;
        },
        watch: function (key, callback) {
          listeners.forEach(function (val) {
            if (val.key === key && val.callback === callback) return;
          });
          listeners.push({
            key: key,
            callback: callback
          });
        },
        unwatch: function (key, callback) {
          listeners.forEach(function (val, i) {
            if (val.key === key && val.callback === callback) {
              return listeners.splice(i, 1);
            }
          });
        },
        once: function (key, callback) {
          var self = this;
          this.watch(key, function temp(key, oldVal, newVal) {
            callback(key, oldVal, newVal);
            self.unwatch(key, temp);
          });
        }
      };
      return _methods;
    }();

    var exports = {
      notice: notice,
      getDatePicker: getDatePicker,
      plexi: plexi,
      settings: settings,
      getCompressedImage: getCompressedImage,
      alert: _alert
    };
    this.$get = function(){
      return exports;
    };
  }).
  provider('Item', function () {

    this.$get = function () {
      return {
        empty: function (){ 
          return [this.one()];
        },
        one: function () {
          return {
            'pictures': [],
            'post': ''
          };
        },
        picture: function (src, file) {
          var img = new Image();
          img.src = src;
          return {
            'src': src,
            'progress': 0,
            'file': file,
            'img': img
          }
        }
      };
    };
  }).
  provider('ModManager', ['HashManagerProvider', function ModManager(HashManager) {
    var currentMod = null,
    DEFAULT_ANIMATION = function (leaving, coming, unload, after) {

      var l_ele = document.getElementById("mod-" + leaving),
      c_ele = document.getElementById("mod-" + coming);

      /*
      $("#mod-" + leaving).animate({"opacity": 0, "left": "-=50px"}, 300, function(){
        $("#mod-" + leaving).animate({"left": "+=50px"}, 0);
        $("#mod-" + leaving).css("display", "none");
        $("#mod-" + coming).css({"display": "block", "opacity": 0});
        $("#mod-" + coming).animate({"left": "+=50px"}, 300, function(){
          $("#mod-" + coming).animate({"left": "-=50px", "opacity": 1}, 300, function(){
            next();
          });
        });
      });

      return;
      */

      var rAF = requestAnimationFrame || webkitRequestAnimationFrame || mozRequestAnimationFrame || oRequestAnimationFrame || msRequestAnimationFrame;
      $('#mod-' + leaving).css({'-webkit-transform': 'translateX(-50px)', 'opacity': 0});
      setTimeout(function () {
        $('#mod-' + leaving).css({display: 'none', '-webkit-transform': 'translateX(0px)', opacity: 1});
        $('#mod-' + coming).css({display: 'block', opacity: 0, '-webkit-transform': 'translateX(50px)'});
        rAF(function () {
          $('#mod-' + coming).css({'-webkit-transform': 'translateX(0px)', opacity: 1});
          document.getElementById('mod-' + coming).style.removeProperty('-webkit-transform');
        });
        unload();
        setTimeout(function () {after();}, 300);
        
      }, 300);
    };

    var switching = false,
        pending = false;

    var before_listeners = [],
    after_listeners      = [],
    unload_listeners     = [],
    start_listeners      = [],
    getListeners = function(type){
      switch(type){
        case "before":
          return before_listeners;
        case "after":
          return after_listeners;
        case "unload":
          return unload_listeners;
        case 'start':
          return start_listeners;
      }
      return null;
    },
    doListeners = function(type, mod){
      var _listeners = getListeners(type);
      var stop = false;
      for(var i = _listeners.length; i--;){
        stop = _listeners[i](mod);

        if (type === 'start' && stop) {
          return stop;
        }
      }
    },
    enter = function(mod, animation){

      if (switching !== false) {
        pending = mod;
        return;
      }
      switching = true;
      /*
      if(mod === self.initMod){
        currentMod = mod;
        self.initMod = null;
        return;
      } */
      var back = doListeners('start', mod);
      if (back) {
        //HashManager.slience();
        location.hash = back;
        switching = false;
        if (pending) {
          enter(pending);
        }
        return;
      }
      if (1) {

        if (currentMod === null) currentMod = self.initMod;
        
        if (typeof animation !== 'function') {
          animation = DEFAULT_ANIMATION;
        }
        doListeners("before", mod);
        if (self.firstLoad) {
          self.firstLoad = false;

          currentMod = mod;
          doListeners("after", mod);
          switching = false;
          if (pending) {
            enter(pending);
            pending = false;
          }
          document.getElementById("mod-" + self.initMod).style.display = "none";
          document.getElementById("mod-" + mod).style.display = "block";
          return;
        }
        //document.body.style.overflow = "hidden";
        animation(currentMod, mod, function () {
          doListeners("unload", currentMod);
        }, function(){
          doListeners("after", mod);
          document.body.style.overflow = "auto";
          currentMod = mod;
          switching = false;
          if (pending) {
            enter(pending);
            pending = false;
          }
        });
      }
    };

    var self = this;
    this.initMod = null;
    this.firstLoad = true;
    this.enter = enter;
    this.data = null;
    this.$get = function(){
      return {
        /** 
         * 进入一个mod, 在HTML中一个mod需要以mod-[mod名字]作为id, 例: mod-signIn
         * @param {String} mod 要进入的mod名
         * @param {Function} animation 动画函数, 负责处理mod消失与出现。接受3个参数：当前mod名，切换到的mod名，动画执行完毕后需要调用的回调函数。
         */
        enter: enter,
        /**
         * 3个事件: before(正要向某个mod切换), after(已经切换到某个mod), unload(某个mod被卸载)
         */
        addListener: function(type, fn){
          var _listener = getListeners(type);
          _listener.push(fn);
        },
        removeListener: function(type, fn){
          var _listener = getListeners(type);
          for(var i = _listener.length; i--;){
            if(_listener[i] === fn){
              _listener.splice(i, 1);
              return true;
            }
          }
          return false;
        },
        get currentMod(){
          return currentMod;
        },
        set initMod(val){
          self.initMod = val;
        },
        setData: function (data){
          self.data = data;
        },
        getData: function (){
          return self.data;
        }
      };
    };
  }]);
