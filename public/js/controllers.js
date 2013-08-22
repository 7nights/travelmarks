'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('SignInCtrl', ['$scope', '$http', 'ModManager', 'Util', 'User', function ($scope, $http, ModManager, Util, User) {
    // hide || show nav
    ModManager.addListener('before', function (mod) {
      if (mod === 'signIn') {
        setTimeout(function temp() {
          document.getElementById('login-username').focus();
          if (document.activeElement !== document.getElementById('login-username')) setTimeout(temp, 100);
        }, 300);
        $scope.$emit('NavCtrl.hide');
      }
    });
    ModManager.addListener('unload', function (mod) {
      if (mod === 'signIn') {
        $scope.$emit('NavCtrl.show');
      }
    });
    $scope.loginBoxDesc = 'Sign up right now!';
    $scope.loginBtn = 'Sign In';
    $scope.showEmail = false;
    $scope.errorMessage = '';
    var signupMode = false;
    $scope.signUp = function (ev){
      if ($scope.submiting) return;
      signupMode = !signupMode;
      if (signupMode) {
        $scope.loginBtn = 'Sign Up';
        $scope.loginBoxDesc = 'Already have an account.';
        $scope.showEmail = true;
        var height = $('#login-email').height();
        $('#login-email, #login-repassword').css({'height': 0, 'opacity': 0});
        $('#login-email, #login-repassword').animate({'height': height, 'opacity': 1}, 200);
      } else {
        $scope.loginBtn = 'Sign In';
        $scope.loginBoxDesc = 'Sign up right now!';
        $scope.showEmail = false;
      }
      
      !!ev && ev.preventDefault();
    };
    $('#login-password').keydown(function (ev) {
      if (ev.keyCode === 13) $scope.submit();
    });
    $scope.submit = function (ev){
      if ($scope.submiting) return;
      // check input
      var REG_USERNAME = /^[^_]([a-zA-Z0-9\u4e00-\u9fa5]+_?)+[^_]$/;
      if (signupMode && !REG_USERNAME.test($scope.inputUsername)){
        Util.notice('用户名非法', 10000000);
        return alert("用户名非法");
      }
      // TODO 各种验证
      if (!$scope.inputUsername || !$scope.inputPassword) {
        return $scope.errorMessage = '表格要完整才可以呈上~';
      }
      if (signupMode && !$scope.inputEmail) {
        return $scope.errorMessage = '表格要完整才可以呈上~';
      }
      if ($scope.inputUsername < 5) {
        return $scope.errorMessage = '用户名必须大于5个字符';
      }
      if (signupMode && $scope.inputPassword !== $scope.inputRepassword) {
        return $scope.errorMessage = '两次输入的密码不相同';
      }
      if (!document.getElementById('login-email').validity.valid) {
        return $scope.errorMessage = '请输入正确的电子邮箱'; 
      }
      $scope.submiting = true;
      $('#login-btn').css('opacity', '.3');

      if (!signupMode) {
        $http({method: 'POST', url: '/signin', data: {
          name: $scope.inputUsername,
          passwd: hex_md5($scope.inputPassword)
        }}).
          success(function (data, status, headers, config) {
            $scope.submiting = false;
            $('#login-btn').css('opacity', '1');
            // TODO
            if (data.status === 1) {
              if(User.eatCookie()){
                window.location.hash = 'home';
              }
            } else {
              window.location.hash = '';
              $scope.errorMessage = data.message;
              $('#login-btn').css('opacity', '1');
            }
          }).
          error(function () {
            $scope.submiting = false;
            $('#login-btn').css('opacity', '1');
            // TODO
            window.location.hash = "";
          });
      } else {
        $http({method: 'POST', url: '/signup', data: {
          name: $scope.inputUsername,
          email: $scope.inputEmail,
          passwd: hex_md5($scope.inputPassword),
          repasswd: hex_md5($scope.inputRepassword)
        }}).
          success(function (data, status, headers, config) {
            $scope.submiting = false;
            if (data.status === 1) {
              $scope.errorMessage = '创建成功~';
              $scope.inputPassword = '';
              $scope.signUp();
            } else {
              window.location.hash = '';
              $scope.errorMessage = data.message;
              $('#login-btn').css('opacity', '1');
            }
          }).
          error(function () {
            // TODO
            $scope.submiting = false;
          });
      }

    };
  }]).
  controller('ExploreCtrl', ['$scope', '$http', 'User', 'ModManager', function ($scope, $http, User, ModManager) {
    $scope.marks = [];
    var cachedMarks;

    ModManager.addListener('before', function (mod) {
      if (mod !== 'explore') return;

      // TODO
      if (cachedMarks) return;
      if (msry) {
        displayMode = !displayMode;
        msry.masonry('destroy');
        msry = null;
        document.querySelector('.explore-container').classList.remove('tworows');
      }
      $http.get('/mark/explore?type=' + 'latest').
      success(function (data) {
        if (data.status === -1) return alert('TODO: Error!');

        $scope.marks = data;
        cachedMarks = true;
      }).
      error(function () {
        // TODO
      });
    });

    var displayMode = 0,
        msry;
    function getMsry() {
      return $('.explore-container').masonry({
        itemSelector: '.explore-mark',
        columnWidth: 442,
        gutter: 10
      });
    }
    $scope.switchMode = function () {
      displayMode = !displayMode;
      if (displayMode) {
        // 2 rows mode
        msry = getMsry();
        document.querySelector('.explore-container').classList.add('tworows');
        setTimeout(function () {
          msry = getMsry();
        }, 0);
      } else {
        // single row mode
        if (msry) {
          msry.masonry('destroy');
          msry = null;
          document.querySelector('.explore-container').classList.remove('tworows');
        }
      }
    };
    $scope.getAvatar = function (url) {
      return 'http://www.gravatar.com/avatar/' + url + '?s=24&d=mm';
    };

    // go to detail
    $scope.goDetail = function (ev) {
      while (ev.target.tagName !== 'LI') ev.target = ev.target.parentElement;
      var order = ev.target.dataset.itemNo;
      location.hash = '#detail/' + $scope.marks[order]['_id'];
    };

  }]).
  controller('NavCtrl', ['$scope', '$http', 'User', '$rootScope', function ($scope, $http, User, $rootScope) {
    $scope.hideNav = false;
    // hide || show nav
    $rootScope.$on('NavCtrl.hide', function () {
      $scope.hideNav = true;
      $scope.$digest();
    });
    $rootScope.$on('NavCtrl.show', function () {
      $scope.hideNav = false;
      $scope.$digest();
    });

    function bindUserinfo() {
      if (User.email) {
        $scope.avatar = 'http://www.gravatar.com/avatar/' + hex_md5(User.email) + '?s=32&' + 
          'd=mm';
        $scope.email = User.email;
        $scope.signout = "signout?_csrf=" + User._csrf;
        //$scope.$digest();
      }
    }
    User.$watch('name', function(newVal, oldVal, scope) {
      if (newVal) {
        bindUserinfo();
      }
    });
    setTimeout(bindUserinfo, 0);
  }]).
  controller('HomeCtrl', ['$scope', '$http', 'ModManager', 'User', 'HashManager', function ($scope, $http, ModManager, User, HashManager) {
    // init && clean up
    ModManager.addListener('before', function (mod) {
      if (mod === 'home' ) {
        if (!User.email) {
          return;
          return location.hash = "";
        }
        if(!cached || HashManager.getArgs().refresh) {
          cached = true;
          getData();
        }
      }
    });

    var cached = false;

    $scope.totalMarks = 0;
    $scope.totalPictures = 0;
    $scope.marks = [];

    function getData() {
      $http({
        method: 'GET',
        url: '/mark/get'
      }).
      success(function (data) {
        $scope.marks = data.marks;
        $scope.totalMarks = data.totalMarks;
        $scope.totalPictures = data.totalPictures;
      });
    }

    $scope.filterDate = function (date) {
      return new Date(date).toLocaleString();
    };

    document.getElementById('signIn-cover').style.backgroundImage = 'url(img/samples/' + Math.round(Math.random() * 6 + 1) + '.jpg)';

    $scope.modeSwitch = function (mode) {
      $('.mark').css({'margin-top': 10, 'border-bottom-width': '3px'});
      $('.marks-container').removeClass('list');
      switch (mode) {
        case 'middle':
          //$('.mark').height('200px');
          $('.mark').animate({'height': '200px'});
          break;
        case 'small':
          //$('.mark').height('100px');
          $('.mark').animate({'height': '100px'});
          break;
        case 'large':
          //$('.mark').height('400px');
          $('.mark').animate({'height': '400px'});
          break;
        case 'list':
          $('.mark').animate({'height': '40px'});
          $('.marks-container').addClass('list');
          $('.mark').css({'margin-top': 0, 'margin-bottom': 0, 'border-bottom-width': 0});
      }
    };
    $scope.goTo = function (id) {
      location.hash = "detail/" + id;
    };
  }]).
  controller('DetailCtrl', ['$scope', '$http', 'HashManager', 'ModManager', 'User', function ($scope, $http, HashManager, ModManager, User) {
    var lastData;

    ModManager.addListener('before', function (mod) {
      mode2rows = false;
      if (msry) {
        msry.masonry('destroy');
        msry = null;
      }
      var Item = {
        one: function () {
          return {
            pictures: [],
            post: ''
          };
        },
        empty: function () {
          return [this.one()];
        },
        picture: function (src) {
          return {
            src: src,
            loaded: false
          };
        }
      };
      if (mod === 'detail') {
        // init && clean up
        if (HashManager.getArgs().id !== cachedId) {
          $scope.title = '';
          $scope.location = '';
          $scope.read = 0;
          $scope.author = '';
          $scope.summary = '';
          $scope.total = 0;
          $scope.date = '';
          $scope.items = [];
          cachedId = HashManager.getArgs().id;
          setTimeout(function () {
            document.body.scrollTop = 0;
          }, 300);
        } else {
          return;
        }
      } else {
        return;
      }

      $scope.items = Item.empty();

      $http({
        method: 'GET',
        url: 'mark/getMark',
        params: {
          id: HashManager.getArgs().id
        }
      }).
      success(function (data) {
        if (data.status !== -1) {
          lastData = data;
          lastData.id = HashManager.getArgs().id;
          $scope.id = HashManager.getArgs().id;
          $scope.title = data.title;
          $scope.location = data.location;
          $scope.read = data.read;
          $scope.author = data.author;
          $scope.summary = data.summary;
          $scope.total = data.total;
          $scope.date = data.date;
          if ($scope.author === User.name) {
            $scope.editable = true;
          } else {
            $scope.editable = false;
          }
          
          // parse data.items
          $scope.items = [];
          data.items.forEach(function (val) {
            var it = Item.one();
            it.post = val.post;
            it.title = val.title;
            it.date = val.date;
            it.tag = val.tag;
            it.tag.uid = parseInt(Math.random() * 10000) + '' + parseInt(Math.random() * 10000);

            val.pictures.forEach(function (pic) {
              var newPic = Item.picture(pic),
                  img = new Image();
              if (img.complete) {
                newPic.loaded = true;
                try {
                  $scope.$digest();
                } catch(e) {}
              } else {
                img.onload = function () {
                  newPic.loaded = true;
                  try {
                    $scope.$digest();
                  } catch(e) {}
                };
              }
              img.src = pic;
              it.pictures.push(newPic);
            });
            $scope.items.push(it);
          });

        }
      });
      $scope.$digest();
    });
    
    $scope.edit = function () {
      
      ModManager.setData(lastData);
      location.hash = 'upload/edit';
    };
    $scope.remove = function () {
      var ensure = prompt('Do you really want to delete this mark? Enter DELETE to continue.');
      if (ensure === 'DELETE') {
        var markId = $scope.id;
        $http({
          method: 'post',
          url: '/mark/delete',
          data: {
            markId: markId,
            _csrf: User._csrf
          }
        }).
        success(function (data) {
          if (data.status === 1) {
            return location.hash = "home/refresh";
          }
        }).
        error(function () {
          // TODO
        });
      }
    };
    $scope.wordWrap = function (val) {
      return val;
      //return val.replace(/\n/g, '<br />');
    };
    $scope.dateFilter = function (d, format) {
      var d = new Date(d);
      switch(format) {
        case 0:
          return d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate();
        case 1:
          return (d.getMonth() + 1) + '.' + d.getDate();
      }
    };
    var mode2rows = false,
        msry;
    $scope.getMode = function () {
      if (mode2rows) return 'tworows';
      return '';
    };
    $scope.switchMode = function () {
      mode2rows = !mode2rows;
      if (mode2rows) {
        msry = $('.item-box li').masonry({
          itemSelector: '.it-pic-container, .it-post, .item-date',
          columnWidth: 435
        });
        setTimeout(function () {
          msry = $('.item-box li').masonry({
            itemSelector: '.it-pic-container, .it-post, .item-date',
            columnWidth: 435,
            gutter: 5
          });
        }, 20);
        
        return;
      }
      if (msry) {
        msry.masonry('destroy');
        msry = null;
      }
    };

    var cachedId = null;

    $scope.title = '';
    $scope.location = '';
    $scope.read = 32;
    $scope.author = '';
    $scope.summary = '';
    $scope.total = 0;
    $scope.date = '';
    /*
    $scope.items = [{
      pictures: [{src: 'img/samples/1.jpg', loaded: false}, {src: 'img/samples/7.jpg', loaded: false}, {src: 'img/samples/3.jpg', loaded: false}],
      post: '日本国（Japan），由本州、四国、九州、北海道四个大岛及6900多个小岛组成的东亚群岛国家。日本国的名意为“日出之国”。公元4世纪中叶成为统一的国家，当时称为大和国，645年大化革新后经济文化不断发展，19世纪中期明治维新后成为帝国主义列强之一，对外逐步走上侵略扩张道路，在二战期间侵略中国、朝鲜等亚洲国家，二战战败后实行以天皇为国家象征的君主立宪制，经济实力迅速提高。日本以大和民族为主体，日本是八国集团、二十国集团、世界贸易组织、亚太经合组织成员国。日本是世界第三大经济体。还在科技、教育、医学、工业等方面始终位于世界最前列，国民拥有极高的生活质量，是全球最富裕、经济最发达和生活水平最高的国家之一。'
    }];
    */
    $scope.ifLoad = function (i, j) {
      return $scope.items[i].pictures[j].loaded?'loaded':'';
    };
    
  }]).
  controller('UploadCtrl', ['$scope', '$http', 'ModManager', 'Item', '$q', 'Util', 'HashManager', function ($scope, $http, ModManager, Item, $q, Util, HashManager) {
    // init && clean up
    var req = new google.maps.places.PlacesService(document.createElement('div')),
        cachedData,
        cachedItems;
    //var req = new google.maps.places.AutoCompleteService();
    ModManager.addListener('before', function (mod) {
      if (mod === 'upload' ) {
        $scope.editMode = false;
        $scope.title = '';
        $scope.summary = '';
        $scope.locTags = [];
        $scope.items = Item.empty();
      }
      if (HashManager.getArgs().edit === 'edit'){
        $scope.editMode = true;
        var m = ModManager.getData();
        if (!m) return history.back();
        cachedData = m;
        cachedItems = [];
        cachedData.items.forEach(function (val, i) {
          var obj = {
            title: val.title,
            date: val.date,
            _id: val._id,
            post: val.post,
            tag: {
              _id: val.tag._id
            },
            pictures: cachedData.items[i].pictures.slice()
          };
          cachedItems[i] = obj;
        });
        ModManager.setData(null);
        $scope.title = m.title;
        $scope.author = m.author;
        $scope.summary = m.summary;
        $scope.locTags = [];
        $scope.id = m.id;
        var added = [];
        m.items.forEach(function (val) {
          var tag = val.tag;
          if (tag._id in added) return;
          added[tag._id] = true;
          val.addr = tag.addr || 'loading...';
          val.pos = val.addr;
          $scope.locTags.push({
            id: tag._id,
            name: tag.name,
            geometry: {
              lat: tag.lat,
              lng: tag.lng
            },
            uid: tag.uid,
            pos: tag.addr || 'loading...',
            results: [{
              formatted_address: tag.addr || tag.name,
              geometry: {
                location: {
                  lat: function () {
                    return this.geometry.lat;
                  },
                  lng: function () {
                    return this.geometry.lng;
                  }
                }
              }
            }],
            activeTag: 0
          });
          var i = $scope.locTags.length - 1;
          if (!val.addr) {
            req.nearbySearch({
              location: new google.maps.LatLng(tag.lat, tag.lng),
              radius: 5
            }, function (arr) {
              $scope.locTags[i].pos = arr[0].vicinity;
            });
          } else {
            $scope.locTags[i].pos = val.addr;
          }

        });
        $scope.items = m.items;
        $scope.$digest();
      }
      $scope.$digest();
    });
    ModManager.addListener('after', function (mod) {
      if (mod === 'upload' ) {
        
        setTimeout(function temp() {
          var input = document.getElementById('upload-title-input');
          input.focus();
          if (document.activeElement !== input) {
            setTimeout( temp, 100);
          }
        }, 100);

        // tips
        setTimeout(function () {
          if (Util.settings.get('upload-tips', false) || HashManager.getArgs().edit === 'edit') return;
          Util.settings.set('upload-tips', true);
          var sq = new Utils.syncQueue();
          sq.push(function (args, next) {
            var e = document.getElementById('upload-title-input');
            Util.notice('<strong>Step 1.</strong> Give your mark a name. (press enter to next step)', 99999, e);
            $(document).one('keydown', function temp(ev) {
              if (ev.keyCode !== 13) {
                return $(document).one('keydown', temp);
              }
              Util.plexi(false, 'title');
              next(null);
            });

            Util.plexi(true, 'title', 0, [e.parentNode]);
          }).
          push(function (args, next) {
            var e = document.getElementById('upload-location-input');
            Util.notice('<strong>Step 2.</strong> Type a place and PRESS ENTER.', 99999, e);
            $(document).one('keydown', function temp(ev) {
              if (ev.keyCode !== 13) {
                return $(document).one('keydown', temp);
              }
              ev.preventDefault();
              Util.plexi(false, 'location');
              next(null);
            });
            Util.plexi(true, 'location', 0, [e.parentNode]);
          }).
          push(function (args, next) {
            var e = document.querySelector('#mod-upload textarea');
            e.focus();
            Util.notice('<strong>Step 3.</strong> Here your story begins... (press enter to next step)', 99999, e);
            $(document).one('keydown', function temp(ev) {
              if (ev.keyCode !== 13) {
                return $(document).one('keydown', temp);
              }
              ev.preventDefault();
              Util.notice(null);
              Util.plexi(false, 'summary');
              next(null);
            });
            Util.plexi(true, 'summary', 0, [e.parentNode]);
          }).
          push(function (args, next) {
            args && next; // fixed uglify
            var e = angular.element('<div style="position: fixed; background-color: #E9A782; color: white;"></div>')[0];
            var bounds = document.querySelector('#mod-upload .item-box').getBoundingClientRect();
            e.style.left = bounds.left + 'px';
            e.style.top = bounds.top + 'px';
            e.style.width = bounds.right - bounds.left + 'px';
            e.style.height = bounds.bottom - bounds.top + 'px';
            e.innerHTML = '<div style="padding: 10px; font-size: 20px; margin-top: 60px; text-align: center;">A mark is composed of sites. And each site consists of a title, a description and some pictures.</div>';
            document.body.appendChild(e);
            Util.plexi(true, 'item', 0, [e]);
            setTimeout(function () {
              document.querySelector('#mod-upload .item-box li .it-post-title').focus();
              e.parentNode.removeChild(e);
              Util.plexi(false, 'item');
            }, 6000);
          }).
          exec();
        }, 300);
      }
    });

    // title input
    $('#upload-title-input').keydown(function (ev) {
      if (ev.keyCode === 13) {
        $('#upload-location-input').focus();
        ev.preventDefault();
      }
    });

    // location tag selector
    var ltsScope,
        lts_ce;

    // location input
    var lsScope,
        clonedElement,
        preventReload = true;
    angular.injector(['ng']).invoke(['$rootScope', '$compile', function ($rootScope, $compile) {
      lsScope = $rootScope.$new();
      ltsScope = $scope.$new();
      lsScope.deleteTag = function () {

        var uid = $scope.locTags[lsScope.order].uid;
        $('#mod-upload .item-box li').each(function (i, val) {
          if ($scope.items[i].tag && $scope.items[i].tag.uid === uid) {
            $scope.items[i].tag = null;
          }
        });
        $scope.locTags.splice(lsScope.order, 1);
        $scope.$digest();
        lsScope.show = false;
      };
      var e = angular.element('<div ng-show="show" class="upload-location-selector"><div class="selector-nav"><span class="selector-result"><i class="icon-white icon-map-marker"></i><span ng-bind-template="{{result}}" class="result-text"></span></span></div><div class="input-wrap"><input ng-model="inputName" type="text" class="selector-input-name" /></div><div class="input-wrap"><input type="text" class="selector-input-pos" ng-model="inputPos" /></div><div class="selector-results"><div class="results-item" ng-repeat="it in results" data-item-order="{{$index}}" ng-bind-template="{{it.formatted_address}}"></div><div class="results-footer" ><div ng-click="deleteTag()" class="delete">Delete this tag</div><div class="results-num" ng-bind-template="{{results.length}} result(s)"></div><div class="clear"></div></div></div></div>');
      clonedElement = $compile(e)(lsScope, function (clonedElement, scope) {
        document.body.appendChild(clonedElement[0]);
        var list = document.getElementsByClassName('selector-results')[0];
        list.addEventListener('click', function (ev) {
          if (!ev.target.classList.contains('results-item')) return;
          var order = +ev.target.dataset.itemOrder;
          $scope.locTags[lsScope.order].pos = lsScope.results[order]['formatted_address'];
          $scope.locTags[lsScope.order].results = lsScope.results;
          $scope.locTags[lsScope.order].activeTag = order;
          lsScope.show = false;

          $scope.$digest();
          lsScope.$digest();
          ev.stopPropagation();
        });
        var junk = document.createElement('div');
        var req = new google.maps.places.PlacesService(junk);
        var throttle_t,
            throttle_count,
            THROTTLE_CD = 300;

        lsScope.$watch('inputName', function (newVal, oldVal) {
          if (!$scope.locTags) return;
          $scope.locTags[lsScope.order].name = newVal;
          $scope.$digest();
        });
        lsScope.$watch('inputPos', function (newVal, oldVal) {

          if (oldVal === undefined) return;
          if (preventReload) return preventReload = false;
          if (!newVal) return;
          
          function sendRequest() {
            if (!lsScope.inputPos) return;
            req.textSearch({
              query: lsScope.inputPos
            }, function (arr) {
              lsScope.results = arr;
              try{
                lsScope.$digest();
              } catch(e) {}
            });
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

        });
      });
      window.addEventListener('resize', function () {
        if (clonedElement[0]._bindElement) {
          var bounds = $(clonedElement[0]._bindElement).offset();
          clonedElement[0].style.top = bounds.top - 9 + "px";
          clonedElement[0].style.left = bounds.left - 22 + "px";
        }
      });

      // lts
      ltsScope.show = false;
      e = angular.element("<div ng-show='show' class='tag-selector'><div ng-repeat='tag in locTags' class='tag' data-item-order='{{$index}}' ng-bind-template='{{tag.name}}'></div></div>");
      lts_ce = $compile(e)(ltsScope, function (lts_ce, scope) {
        document.body.appendChild(lts_ce[0]);
        $(lts_ce[0]).delegate('.tag', 'click', function (ev) {
          if (!this.classList.contains('tag')) {
            return;
          }
          var item_order = getItemOrder(ltsScope.currentTarget),
              order = ev.target.dataset.itemOrder;

          ltsScope.show = false;
          $scope.items[item_order].tag = $scope.locTags[order];
          $scope.$digest();
        });
      });
    }]);

    lsScope.show = false;
    lsScope.$digest();
    $scope.locTags = [];
    $('#upload-location-input').bind('keydown', function (ev) {
      if (ev.keyCode === 13) {
        if ($.trim(ev.target.value) === '') return;
        $scope.locTags.push({
          name: ev.target.value,
          pos: 'loading...',
          uid: parseInt(Math.random() * 10000) + parseInt(Math.random() * 10000)
        });
        $scope.$digest();
        var i = $scope.locTags.length - 1,
            val = ev.target.value;
        var req = new google.maps.places.PlacesService(document.createElement('div'));
        
        ev.target.value = '';
        req.textSearch({
          query: val
        }, function (arr) {
          if (arr.length === 0) {
            $scope.locTags.splice(i, 1);
            return alert("not found");
          }
          $scope.locTags[i].results = arr;
          $scope.locTags[i].activeTag = 0;
          $scope.locTags[i].pos = arr[0]['formatted_address'];

          var list = $('#mod-upload .item-box li');
          for (var j = list.length; j--; ){
            if (!$scope.items[j].tag) {
              $scope.items[j].tag =  $scope.locTags[$scope.locTags.length - 1];
            }
          }

          $scope.$digest();
        });
      }
    });
    var lastClickedTag;
    $('#mod-upload .item-box').delegate('.item-tag', 'click', function (ev) {

      if (lastClickedTag === ev.target && ltsScope.show) {
        ltsScope.show = false;
        return ltsScope.$digest();
      }
      lastClickedTag = ev.target;
      ltsScope.currentTarget = ev.target;

      ltsScope.show = true;
      var bounds = $(ev.target).offset();
      bounds.bottom = bounds.top + ev.target.offsetHeight;
      bounds.right = bounds.left + ev.target.offsetWidth;
      ltsScope.$digest();
      lts_ce[0].style.top = bounds.bottom + "px";
      lts_ce[0].style.left = bounds.right - lts_ce[0].offsetWidth + "px";
    });
    $('.location-tags-container').delegate('.location-tag', 'click', function (ev) {
      preventReload = true;
      while(! ('itemOrder' in ev.target.dataset)) ev.target = ev.target.parentNode;
      var e = ev.target,
          selector = document.getElementsByClassName('upload-location-selector')[0];
      var order = +e.dataset.itemOrder;
      lsScope.show = true;
      lsScope.result = $scope.locTags[order].name + ' - ' + $scope.locTags[order].pos;
      lsScope.inputName = $scope.locTags[order].name;
      lsScope.inputPos = $scope.locTags[order].pos;
      lsScope.results = $scope.locTags[order].results;
      lsScope.order = order;
      lsScope.$digest();
      var bounds = $(e).offset();
      clonedElement[0]._bindElement = e;
      clonedElement[0].style.top = bounds.top - 9 + "px";
      clonedElement[0].style.left = bounds.left - 22 + "px";
      ev.stopPropagation();

      $(document).one('click', function temp(ev) {
        if (!lsScope.show) return;
        var e = ev.target;
        while(e && e.classList) {
          if (e.classList.contains('upload-location-selector')) {
            if (lsScope.show) {
              $(document).one('click', temp);
            }
            return;
          }
          e = e.parentNode;
        }
        lsScope.show = false;
        clonedElement[0]._bindElement = null;
        lsScope.$digest();
      });
    });

    // 点击删除图片
    $('#mod-upload .item-box').delegate('.upload-pictures-list', 'click', function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      var e = ev.target;
      while (!e.dataset.order) e = e.parentNode;
      var itemOrder = getItemOrder(e);
      $scope.items[itemOrder].pictures.splice(+e.dataset.order, 1);
      $scope.$digest();
      return false;
    });

    // focus
    $('#mod-upload .item').delegate('input, textarea', 'focus', function (ev) {
      ev.target.parentElement.classList.add('focus');
    });
    $('#mod-upload .item').delegate('input, textarea', 'blur', function (ev) {
      ev.target.parentElement.classList.remove('focus');
    });
    $('#mod-upload .item').click(function (ev) {
      if (!$(ev.target).hasClass('item')) {
        ev.target = ev.target.parentElement;
      }
      var input = ev.target.getElementsByTagName('input')[0] || ev.target.getElementsByTagName('textarea')[0] || ev.target.parentNode.parentNode.getElementsByTagName('input')[0];
      input.focus();
    });

    var picker;
    $('.item-box').delegate('.it-post-date', 'focus', function (ev) {
      var input = ev.target;
      input.blur();
      if (picker) return;
      picker = Util.getDatePicker(null, function (date) {
        if (date === null) return picker = null;
        picker.parentElement.removeChild(picker);
        picker = null;
        input.dataset.date = date.getTime();
        input.value = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
        $scope.items[getItemOrder(input)].date = input.value;
        $scope.$digest();
      });
      picker.className = 'date-picker';
      document.body.appendChild(picker);
    });

    var set = false;
    document.addEventListener('dragenter', function (ev) {

      if(!set && ev.dataTransfer.types[0] === 'Files'){
        set = true;
        document.body.classList.add('dragenter');
      }
      ev.preventDefault();
      return false;
    }, false);
    document.addEventListener('dragover', function (ev) {

      if(!set && ev.dataTransfer.types[0] === 'Files'){
        set = true;
        document.body.classList.add('dragenter');
      } else if (ev.dataTransfer.files.length > 0) {
        ev.dataTransfer.effectAllowed = 'none';
        ev.dataTransfer.dropEffect = 'none';
        ev.preventDefault();
      }

      if ((ev.target.classList.contains('upload-pictures') 
        || ev.target.classList.contains('drop-pictures')
        || (ev.target.parentElement && ev.target.parentElement.classList.contains('drop-pictures')))
        && ev.dataTransfer.types[0] === 'Files') {
        ev.dataTransfer.effectAllowed = 'all';
        ev.dataTransfer.dropEffect = 'copy';
        return ev.preventDefault();
      }
      
    }, false);
    document.addEventListener('dragleave', function (ev) {
      if(ev.x !== 0 || ev.y !== 0) return;
      document.body.classList.remove('dragenter');
      set = false;
      ev.preventDefault();
      return false;
    }, false);
    
    $scope.items = Item.empty();
    $scope.addMore = function () {
      $scope.items.push(Item.one());
      // 新创建的item从最后一个tag中继承tag
      $scope.items[$scope.items.length - 1].tag = $scope.locTags[$scope.locTags.length - 1];
    };

    function testExif(f, e) {
      EXIF.getData(f, function () {
        var latitude = EXIF.getTag(this, 'GPSLatitude'),
            date = EXIF.getTag(this, 'DateTimeOriginal');

        if (date) {
          var arr = date.split(':');
          date = new Date();
          date.setFullYear(arr[0]);
          date.setMonth(arr[1] - 1);
          date.setDate(arr[2].split(' ')[0]);
          while (e.tagName !== 'LI') e = e.parentNode;
          var input = e.getElementsByClassName('it-post-date')[0];
          input.dataset.date = date;
          input.value = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate());
          $scope.items[e.dataset.itemNo].date = input.value;
        }
      });
    }
    // 注册drop
    $(document).delegate('.upload-pictures', 'drop', function (ev) {
      var files = ev.originalEvent.dataTransfer.files;
      for(var i = 0, length = files.length; i < length; i++ ) {
        if (files[i].type.indexOf('image') === -1) continue;
        ev.preventDefault();
        /*var fr = new FileReader();
        fr._file = files[i];
        fr.onload = function () {
          $scope.items[getItemOrder(ev.target)].pictures.push(Item.picture(this.result, this._file));
          $scope.$digest();
        };
        fr.readAsDataURL(files[i]);*/
        var worker = new Worker('js/worker-file-reader.js');
        worker._file = files[i];
        worker.addEventListener('message', function (e) {
          var canvas = document.createElement('canvas'),
              ctx = canvas.getContext('2d'),
              img = new Image();
          img.src = e.data;
          /*function drawImage() {
            console.log(img);
            ctx.drawImage(0, 0, img);
            return postMessage(canvas.toDataURL());
          }
          if (img.complete) {
            drawImage();
          } else {
            img.onload = drawImage;
          }*/
          canvas.width = 220;
          canvas.height = 140;
          $scope.items[getItemOrder(ev.target)].pictures.push(Item.picture(e.data, this._file));
          $scope.$digest();
        });
        worker.postMessage({file: files[i], method: 'readAsDataURL'});
        //testExif(files[i], ev.target);
      }
      document.body.classList.remove('dragenter');
      set = false;
      ev.preventDefault();
    });

    /**
     * 获取元素属于第几个item
     * @param {HTMLElement} e
     * @return {Number} item的编号, 从0开始
     */
    function getItemOrder(e){
      while (e !== null) {
        if (e.dataset.itemNo !== undefined) {
          return e.dataset.itemNo;
        }
        e = e.parentElement;
      }
      return -1;
    }
    $scope.progressWidth = function (p) {
      if ($(document.getElementsByClassName('upload-pictures')[0]).hasClass('uploading')) {
        return p.progress / 100 * 216 + 'px';
      }
      return 220 + 'px';
    };
    $scope.getModTitle = function () {
      if ($scope.editMode) {
        return 'Editing Mark';
      }
      return 'Create a Mark!';
    };


    $scope.uploading = false; // 是否处于上传中, 用来已经开始上传任务后disable按钮
    $scope.ifUploading = function () {
      return $scope.uploading ? 'disable-buttons' : '';
    };
    $scope.demoUploadFinished = 0;
    // save 按钮
    $scope.save = function () {
      if ($scope.uploading) return;
      $scope.uploading = true;

      // TODO: 验证
      var pass = true;
      $scope.items.forEach(function (val, i) {
        if (!val.tag) {
          // friendly alert
          alert('You need to select a location tag for each site.');
          pass = false;
        }
      });

      if (!pass) {
        $scope.uploading = false;
        return;
      }

      // edit mode
      if ($scope.editMode) {
        var funcs = [];
        var totalUpdateCount = 0;
        var finishTotalUpdate = function () {
          if (--totalUpdateCount > 0) return;
          location.hash = 'detail/' + $scope.id;
          $scope.uploading = false;
        };

        // 判断mark是否有更改, 如果有提交到队列
        if ($scope.title !== cachedData.title ||
          $scope.summary !== cachedData.summary) {
          funcs.push(function () {
            totalUpdateCount++;
            $http({
              method: 'post',
              url: 'mark/alter',
              data: {
                _id: $scope.id,
                title: $scope.title,
                summary: $scope.summary
              }
            }).success(function () {
              finishTotalUpdate();
            });
          });
        }
        // 判断是否有新的tags, 如果有提交到队列
        var newTags = [];
        $scope.locTags.forEach(function (val, i) {
          if ('_id' in val || 'id' in val) return;
          newTags.push({
            tag: val,
            index: i
          });
        });
        var promises = 0;
        funcs.push(function () {
          newTags.forEach(function (val, i) {
            $http({
              method: 'post',
              url: 'tag/create',
              data: {
                markId: $scope.id,
                name: val.tag.name,
                addr: val.tag.pos,
                lat: val.tag.results[val.tag.activeTag].geometry.location.jb,
                lng: val.tag.results[val.tag.activeTag].geometry.location.kb
              }
            }).
            success(function (data) {
              val.tag._id = data.data.tagId;
              $scope.locTags[val.index].id = data.data.tagId;
              decreasePromises();
            });
            promises++;
          });
          if (newTags.length === 0) {
            decreasePromises();
          }
        });

        var decreasePromises = function () {
          if (--promises > 0) {
            return;
          }
          // 判断是否有更新items, 如果有则修改
          var itemsUpdateCount = 0; // 有多少的items需要更新
          $scope.items.forEach(function (val, i) {
            var updateItem = false,
                waitPicture = 0;

            if (val.title !== cachedItems[i].title ||
              val.post !== cachedItems[i].post ||
              new Date(val.date).getTime() !== new Date(cachedItems[i].date).getTime() ||
              val.tag._id !== cachedItems[i].tag._id
              ) {
              updateItem = true;
            }
            // 是否有新图片
            cachedItems[i].pictures.forEach(function (pic, j) {
              if (pic !== val.pictures[j]) {
                updateItem = true;
              }
            });

            val.pictures.forEach(function (pic, j) {
              if (typeof pic !== 'string') {
                waitPicture++;
                (function (index) {
                  var fd = new FormData();
                  fd.append('image', pic.file);
                  fd.append('itemId', val._id);
                  var xhr = new XMLHttpRequest();
                  xhr.open('POST', '/picture/save');
                  xhr.onload = function () {
                    var result = JSON.parse(xhr.response);
                    if (result.status === -1) {
                      // TODO
                      alert('上传失败');
                    }
                    val.pictures[index] = result.data.url;
                    finishPicture();
                  };
                  xhr.send(fd);
                })(j);
              }
            });

            if (updateItem || waitPicture) {
              itemsUpdateCount++;
              totalUpdateCount++;
            }
            var finishPicture = function () {
              if (--waitPicture > 0) return;
              doUpdateItem();
            },
            doUpdateItem = function () {
              $http({
                method: 'post',
                url: 'item/alter',
                data: {
                  _id: val._id,
                  post: val.post,
                  tag: val.tag._id || val.tag.id,
                  title: val.title,
                  pictures: val.pictures,
                  date: val.date
                }
              }).
              success(function (data) {
                if (data.status === 1) {
                  finishTotalUpdate();
                  doFinishItems();
                }
              });
            };

            if (!waitPicture && updateItem) {
              doUpdateItem();
            }

          });

          function doFinishItems() {
            if (--itemsUpdateCount > 0) return;
          }
        };

        funcs.forEach(function (val) {
          val();
        });

        return;
      }

      $('.upload-pictures').addClass('uploading');
      
      var sq = new Utils.syncQueue(),
          markId;

      sq.
      // step 1: create mark
      push(function (args, next) {

        $http({
          method: 'POST',
          url: 'mark/create',
          data: JSON.stringify({
            title: $scope.title,
            summary: $scope.summary
          })
        }).
        success(function (data, status, headers, config) {
          if (data.status === -1) {
            $scope.uploading = false;
            // throw error
            return next(data);
          }
          // next step
          markId = data.data.markId;
          next(null, data.data.markId);
        }).
        error(function () {
          // TODO: styled alert
          alert('Upload failed. Please try again later.');
        });
      });

      // step 2: create tags
      function createTag(t) {
        sq.push(function (args, next) {
          var tag = {
            markId: markId,
            name: t.name,
            addr: t.pos,
            lat: t.results[t.activeTag].geometry.location.lat(),
            lng: t.results[t.activeTag].geometry.location.lng()
          };
          $http({
            method: 'post',
            url: 'tag/create',
            data: tag
          }).
          success(function (data) {
            if (data.status === 1) {
              t.tagId = data.data.tagId;
              next(null, t.tagId);
            }
          }).
          error(function () {
            // TODO
            next(new Error('Upload failed'));
          });
        });
      }
      $scope.locTags.forEach(function (val, i) {
        createTag(val);
      });

      // step 3: create item & upload pictures
      
      function createItem(_i) {
        var itemId;
        // step 2.1: create item
        sq.push(function (args, next) {
          var tag = $scope.items[_i].tag;
          $http({
            method: 'POST',
            url: 'item/create',
            data: {
              markId: markId,
              date: new Date($scope.items[_i].date).getTime(),
              post: $scope.items[_i].post,
              title: $scope.items[_i].title,
              tag: tag.tagId
            }
          }).
          success(function (data) {
            if (data.status === 1) {
              itemId = data.data.itemId;
              next(null, data.data.itemId);
            }
          }).
          error(function () {
            next(new Error('Upload failed.'));
          });
        });
        // step 3.2: upload pictures
        $scope.items[_i].pictures.forEach(function (val, i) {
          uploadPicture(itemId, val, i);
          $scope.demoUploadFinished++;
        });
      }
      function uploadPicture(itemId, pic, _i) {
      
        sq.push(function (args, next) {
          console.log('upload picture');
          var itemId = args;
          var fd = new FormData();
          fd.append('image', pic.file);
          fd.append('itemId', itemId);
          var xhr = new XMLHttpRequest();
          xhr.open('POST', '/picture/save');
          xhr.onload = function () {
            var result = JSON.parse(xhr.response);
            if (result.status === -1) {
              next(result);
            }
            next(null, itemId);
          };
          xhr.send(fd);

          var randomTime = parseInt(10 + Math.random() * 10);
          setTimeout( function temp() {
            pic.progress++;
            $scope.$digest();
            if (pic.progress < 100) {
              setTimeout(temp, randomTime);
            } else {
              $scope.demoUploadFinished--;
            }
          }, randomTime);
        });
      }
      $scope.items.forEach(function (it, i) {
        if (!it.post && it.pictures.length === 0) return;
        createItem(i);
      });
      
      // finish upload
      sq.push(function temp(args, next) {
        args && next; // fixed uglify
        if ($scope.demoUploadFinished > 0) {
          return setTimeout(temp, 200);
        }
        $scope.uploading = false;
        $('.upload-pictures').removeClass('uploading');
        $scope.items = Item.empty();
        $scope.title = '';
        $scope.summary = '';
        $scope.location = '';
        try {
          $scope.$digest();
        } catch(e) {}
        location.hash = 'detail/' + markId;
      }).
      push(function (err, args, next) {

        if (!err) {
          return next(null, args);
        }
        if (typeof err === 'object' && 'status' in err) {
          alert(err.message);
        }
      }).
      exec();
      try{
        $scope.$digest();
      } catch (e) {}
    };
    // 删除item
    $scope.removeItem = function (ev) {
      var order = getItemOrder(ev.target);
      $scope.items.splice(order, 1);
      ev.preventDefault();
      ev.stopPropagation();
    };
    // 点击上传图片按钮
    var currentUploadTarget = 0;
    $scope.upload = function (ev) {
      var e = ev.target;
      while(e) {
        if ($(e).hasClass('upload-pictures-list')) return;
        e = e.parentNode;
      }
      currentUploadTarget = getItemOrder(ev.target);
      angular.element('.upload-input')[0].click();
    };
    angular.element('.upload-input')[0].addEventListener('change', function (ev) {
      var fr = new FileReader();
      fr.onload = function () {
        $scope.items[currentUploadTarget].pictures.push(Item.picture(this.result, ev.target.files[0]));
        $scope.$digest();
      };
      fr.readAsDataURL(ev.target.files[0]);
    }, false);

  }]);