'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('SignInCtrl', ['$scope', '$http', 'ModManager', 'Util', 'User', function ($scope, $http, ModManager, Util, User) {
    setTimeout(function () {Util.alert('test title', 'testlalala', 'confirm');}, 1000);
    // ---------- initialize ----------
    // 注册链接的文本，在注册模式下变为’已经有一个账号‘
    $scope.loginBoxDesc = 'Sign up right now!';

    // 登录按钮的文本
    $scope.loginBtn = 'Sign In';

    // 是否显示email选项，在注册模式下会显示email以及repassword输入框
    $scope.showEmail = false;

    // 错误信息，用来提示输入错误后的信息，例如用户已经被占用
    $scope.errorMessage = '';

    // 当前模式是否为注册模式，默认界面为登录模式
    var signupMode = false;

    // ---------- functions ----------
    // sign 按钮的opacity
    $scope.getOpacity = function () {
      return {
        opacity: ($scope.submiting?.3:1)
      };
    };
    // 改变模式(登录或注册)
    $scope.signUp = function (ev){
      if ($scope.submiting) return;
      signupMode = !signupMode;
      if (signupMode) { // 注册模式
        $scope.loginBtn = 'Sign Up';
        $scope.loginBoxDesc = 'Already have an account.';
        $scope.showEmail = true;
        var height = $('#login-email').height();
        $('#login-email, #login-repassword').css({'height': 0, 'opacity': 0});
        $('#login-email, #login-repassword').animate({'height': height, 'opacity': 1}, 200);
      } else { // 登录模式
        $scope.loginBtn = 'Sign In';
        $scope.loginBoxDesc = 'Sign up right now!';
        $scope.showEmail = false;
      }
      
      !!ev && ev.preventDefault();
    };
    // 提交表单
    $scope.submit = function (ev){
      if ($scope.submiting) return;
      // check input
      var REG_USERNAME = /^[^_]([a-zA-Z0-9\u4e00-\u9fa5]+_?)+[^_]$/;
      if (signupMode && !REG_USERNAME.test($scope.inputUsername)){
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

    // ---------- events ----------
    // 在输入密码的时候按下password直接提交表单
    $('#login-password').keydown(function (ev) {
      if (ev.keyCode === 13) $scope.submit();
    });
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
    // unload的时候显示nav
    ModManager.addListener('unload', function (mod) {
      if (mod === 'signIn') {
        $scope.$emit('NavCtrl.show');
      }
    });

  }]).
  controller('ExploreCtrl', ['$scope', '$http', 'User', 'ModManager', 'area', function ($scope, $http, User, ModManager, area) {
    // ---------- initialize ----------
    // 用于填充view的marks数组
    $scope.marks = [];
    // 缓存起来的marks, 重复到此页面时不会重复发送请求
    // TODO: 设置一个缓存时间或者添加刷新按钮
    var cachedMarks;
    // ---------- functions ----------
    area('ExploreCtrl.msry', 'define msry', function (exports) {
      var displayMode = 0,
          msry;
      exports.msry = {
        get: function () {
          return msry;
        },
        set: function (value) {
          msry = value;
        }
      };

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
    });

    // [事件函数]获取头像
    $scope.getAvatar = function (url) {
      return 'http://www.gravatar.com/avatar/' + url + '?s=24&d=mm';
    };

    // [事件函数]到详情页面
    $scope.goDetail = function (ev) {
      while (ev.target.tagName !== 'LI') ev.target = ev.target.parentElement;
      var order = ev.target.dataset.itemNo;
      location.hash = '#detail/' + $scope.marks[order]['_id'];
    };

    // ---------- events ----------
    // 进入模块时判断是否有缓存，以及对瀑布流等进行重置
    ModManager.addListener('before', function (mod) {
      if (mod !== 'explore') return;

      var msry = area('ExploreCtrl.msry').msry;
      // TODO
      if (cachedMarks) return;
      if (msry.get()) {
        displayMode = !displayMode;
        msry.get().masonry('destroy');
        msry.set(null);
        document.querySelector('.explore-container').classList.remove('tworows');
      }

      // 没有缓存则请求
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

  }]).
  controller('NavCtrl', ['$scope', '$http', 'User', '$rootScope', function ($scope, $http, User, $rootScope) {
    // ---------- initialize ----------
    // 是否隐藏导航栏
    $scope.hideNav = false;
    // 监听用户信息变化
    User.$watch('name', function(newVal, oldVal, scope) {
      if (newVal) {
        bindUserinfo();
      }
    });

    setTimeout(bindUserinfo, 0);
    
    // ---------- functions ----------
    // 从User中获取用户信息并apply到view上
    function bindUserinfo() {
      if (User.email) {
        $scope.avatar = 'http://www.gravatar.com/avatar/' + hex_md5(User.email) + '?s=32&' + 'd=mm';
        $scope.email = User.email;
        $scope.signout = "signout?_csrf=" + User._csrf;
        //$scope.$digest();
      }
    }

    // ---------- events ----------
    // hide || show nav
    $rootScope.$on('NavCtrl.hide', function () {
      $scope.hideNav = true;
      $scope.$digest();
    });
    $rootScope.$on('NavCtrl.show', function () {
      $scope.hideNav = false;
      $scope.$digest();
    });

  }]).
  controller('HomeCtrl', ['$scope', '$http', 'ModManager', 'User', 'HashManager', function ($scope, $http, ModManager, User, HashManager) {
    // ---------- initialize ----------
    // 是否已经缓存
    var cached = false;
    // 总的marks
    $scope.totalMarks = 0;
    // 总的pictures
    $scope.totalPictures = 0;
    // 填充到view的marks
    $scope.marks = [];
    // 随机显示封面图片，这个应该移动到SignCtrl部分去
    document.getElementById('signIn-cover').style.backgroundImage = 'url(img/samples/' + Math.round(Math.random() * 6 + 1) + '.jpg)';

    // ---------- functions ----------
    // 发送请求数据，并将结果进行填充
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
    
    // 对日期的格式化处理，用于显示到view
    $scope.filterDate = function (date) {
      if (isNaN(new Date(date).getTime())) return '';
      return new Date(date).toLocaleString();
    };
    
    // 切换列表的模式
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

    // [事件函数]进入相应的detail页面
    $scope.goTo = function (id) {
      location.hash = "detail/" + id;
    };

    // ---------- events ----------
    // 当进入模块时判断是否已经登录以及是否已经缓存主页的内容，是否需要强制刷新
    ModManager.addListener('before', function (mod) {
      if (mod === 'home' ) {
        if (!User.email) {
          return;
          return location.hash = "";
        }
        // 没有缓存或者被设置了强制刷新需要重新请求数据
        if(!cached || HashManager.getArgs().refresh) {
          cached = true;
          getData();
        }
      }
    });

  }]).
  controller('DetailCtrl', ['$scope', '$http', 'HashManager', 'ModManager', 'User', '$rootScope', 'area', 'Util', 'DISQUS', function ($scope, $http, HashManager, ModManager, User, $rootScope, area, Util, DISQUS) {
    // ---------- initialize ----------
    // 最后一次从服务器获得的数据
    var lastData;
    // 被缓存的mark的id
    var cachedId = null;

    // 初始化view参数
    $scope.title = '';
    $scope.location = '';
    $scope.read = 0;
    $scope.author = '';
    $scope.summary = '';
    $scope.total = 0;
    $scope.date = '';

    $('.detail-comment').remove();

    // ---------- functions ----------
    // item的方便构造途径
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

    function formatDate(d) {
      d = new Date(d);
      return d.getMonth() + 1 + '-' + d.getDate() + '-' + d.getFullYear();
    }
    // 从服务器获取到数据之后的处理函数
    var eatData = function (data) {
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
        $scope.like_count = data.like_count;
        $scope.liked = data.liked;

        if ($scope.author === User.name) {
          $scope.editable = true;
        } else {
          $scope.editable = false;
        }
        
        // parse data.items
        $scope.items = [];
        data.items.forEach(function (val) {
          var it = Item.one();
          it._id = val._id;
          it.post = val.post;
          it.title = val.title;
          it.date = formatDate(val.date);
          it.tag = val.tag;
          it.tag.uid = parseInt(Math.random() * 10000) + '' + parseInt(Math.random() * 10000);

          val.pictures.forEach(function (pic) {
            var newPic = Item.picture(pic),
                img = new Image();
            img.src = pic;
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
            it.pictures.push(newPic);
          });
          $scope.items.push(it);

        });
        lastData.items = $scope.items;

      } else {
        Util.notice('Mark not found.', 3000);
        cachedId = null;
        window.location.hash = 'explore';
      }
    };

    // [事件函数] 编辑
    $scope.edit = function () {
      ModManager.setData(lastData);
      location.hash = 'upload/edit';
    };

    // [事件函数] 删除
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

    // [view函数] 格式化date以显示
    $scope.dateFilter = function (d, format) {
      var d = new Date(d);
      if (isNaN(d.getTime())) return '';
      switch(format) {
        case 0:
          return d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate();
        case 1:
          return (d.getMonth() + 1) + '.' + d.getDate();
      }
    };

    // 两列模式
    area('UploadCtrl.msry', '2-row mode', function (exports) {
      var mode2rows = false,
          msry;

      // 获取当前模式
      $scope.getMode = function () {
        if (mode2rows) return 'tworows';
        return '';
      };
      // 切换模式
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
      exports.mode2rows = {
        get: function () {
          return mode2rows;
        },
        set: function (val) {
          mode2rows = val;
        }
      };
      exports.msry = {
        get: function () {
          return msry;
        },
        set: function (val) {
          msry = val;
        }
      };
    });

    // [view函数] 判断picture是否载入完毕，如果完毕view会显示picture应用动画
    $scope.ifLoad = function (i, j) {
      return $scope.items[i].pictures[j].loaded?'loaded':'';
    };

    // [view函数] 判断当前用户是否已经给当前mark标记了喜欢
    $scope.ifLiked = function () {
      var rslt = 'collect ';
      return $scope.liked ? rslt + 'liked' : rslt;
    };

    // [view函数] 对当前mark标记喜欢或移除喜欢
    $scope.likeMark = function () {
      if (!User.id) {
        window.location = '';
      }
      var url = 'mark/like';
      var liked = $scope.liked;
      var id = HashManager.getArgs().id;
      if($scope.liked) {
        url = 'mark/dislike';
      }
      $http({
        method: 'GET',
        url: url,
        params: {
          markId: id,
          _csrf: User._csrf
        }
      }).
      success(function (data) {
        if (data.status === 1 && HashManager.getArgs().id === id) {
          $scope.liked = !liked;
          if (liked) {
            $scope.like_count --;
          } else {
            $scope.like_count ++;
          }
        }
      });
    };

    // ---------- events ----------
    // 每次进入页面之后初始化
    ModManager.addListener('before', function (mod) {
      if (mod !== 'detail') {
        return;
      }

      /* 每次进入的时候重置两列模式 */
      var area_msry = area('UploadCtrl.msry');
      area_msry.mode2rows.set(false);
      if (area_msry.msry.get()) {
        area_msry.msry.get().masonry('destroy');
        area_msry.msry.set(null);
      }

      // 如果没有缓存则重置view
      if (HashManager.getArgs().id !== cachedId) {
        $scope.title = '';
        $scope.location = '';
        $scope.read = 0;
        $scope.author = '';
        $scope.summary = '';
        $scope.total = 0;
        $scope.date = '';
        $scope.items = [];
        $scope.liked = 0;
        $scope.like_count = 0;
        cachedId = HashManager.getArgs().id;
        setTimeout(function () {
          document.body.scrollTop = 0;
        }, 300);
      } else {
        $scope.$digest();
        return;
      }

      // 填充items
      $scope.items = Item.empty();

      // 发送请求
      $http({
        method: 'GET',
        url: 'mark/getMark',
        params: {
          id: HashManager.getArgs().id
        }
      }).
      success(eatData);

      // 消化更改，让之前重置的view被渲染
      $scope.$digest();
      console.log($scope.getMode());
    });
    // 清除cachedId
    $rootScope.$on('DetailCtrl.clearCache', function () {
      cachedId = null;
    });
    
  }]).
  controller('UploadCtrl', ['$scope', '$http', 'ModManager', 'Item', '$q', 'Util', 'HashManager', 'area', function ($scope, $http, ModManager, Item, $q, Util, HashManager, area) {
    // ---------- initialize ----------
    // 最后一次被点击的tag
    var lastClickedTag;
    
    // 当前scope里已经生成的地理标签
    $scope.locTags = [];

    $scope.items = Item.empty();

    // 是否处于上传中, 用来已经开始上传任务后disable按钮
    $scope.uploading = false;

    // 用于发送地理位置请求的实例
    var req = new google.maps.places.PlacesService(document.createElement('div')),
        cachedData,
        cachedItems;

    // 用于演示的上传进度是否完成
    $scope.demoUploadFinished = 0;

    // ---------- functions ----------
    // [事件函数] 添加更多item
    $scope.addMore = function () {
      $scope.items.push(Item.one());
      // 新创建的item从最后一个tag中继承tag
      $scope.items[$scope.items.length - 1].tag = $scope.locTags[$scope.locTags.length - 1];
    };

    // 显示tips
    var showTips = function () {
      // 读取setting信息, 如果已经显示过则不再显示
      if (Util.settings.get('upload-tips', false) || HashManager.getArgs().edit === 'edit') return;

      // 设置setting标记已显示过tips
      Util.settings.set('upload-tips', true);

      // tips队列
      var sq = new Utils.syncQueue();
      // step 1
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
      // step 2
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
      // step 3
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
      // step 4
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
    };

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
    
    // 计算图片上传表示进度的div的宽度
    $scope.progressWidth = function (p) {
      if ($(document.getElementsByClassName('upload-pictures')[0]).hasClass('uploading')) {
        return p.progress / 100 * 216 + 'px';
      }
      return 220 + 'px';
    };

    // [view函数] 获取当前页面应该显示的标题
    $scope.getModTitle = function () {
      if ($scope.editMode) {
        return 'Editing Mark';
      }
      return 'Create a Mark!';
    };

    // [view函数] 是否在上传中
    $scope.ifUploading = function () {
      return $scope.uploading ? 'disable-buttons' : '';
    };

    // [事件函数] 删除item
    $scope.removeItem = function (ev) {
      var order = getItemOrder(ev.target);
      $scope.items.splice(order, 1);
      ev.preventDefault();
      ev.stopPropagation();
    };

    // [事件函数] 点击打开上传图片按钮对话框
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

    // [事件函数] save 按钮
    $scope.save = function () {
      if ($scope.uploading) return;

      // 标志正在上传
      $scope.uploading = true;

      // TODO: 验证
      var pass = true,
          msg;

      $scope.items.forEach(function (val, i) {
        if (!val.tag) {
          // friendly alert
          msg = 'You need to select a location tag for each site.';
          pass = false;
        }
        if (!val.title) {
          msg = 'Item\'s title is required.';
          pass = false;
        }
      });

      if (!$scope.title || !$scope.summary) {
        pass = false;
        msg = 'Cannot create a mark without title and summary.';
      }

      // 没有通过验证则取消上传
      if (!pass) {
        alert(msg);
        $scope.uploading = false;
        return;
      }

      // edit mode
      if ($scope.editMode) {
        // 将所有需要做的更改用函数包裹起来并放入这个队列里
        // 以便在最后才执行, 便于中途随时中断
        var funcs = [];

        // 所有需要做的更改的计数
        var totalUpdateCount = 0,
        // 更新item为最后一步，需要最后一步为true才能表示totalUpdateCount做完,
            lastStep = false;

        // 完成一个更改, 将更改计数-1, 并判断是否已经执行完所有更改
        var finishTotalUpdate = function () {
          if (--totalUpdateCount > 0 || !lastStep) return;
          $scope.$emit('DetailCtrl.clearCache');
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
              finishTotalUpdate('mark change');
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

        // 需要让服务器新建立的tag数
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
            //totalUpdateCount++;
          });
          if (newTags.length === 0) {
            decreasePromises();

          }
        });

        // 完成一个tag的建立, 当所有tag建立完成后继续下一步
        var decreasePromises = function () {
          if (--promises > 0) {
            return;
          }

          // 所有tags建立完成

          // 判断是否有更新items, 如果有则修改
          function getPictureUrls(arr) {
            var a = [];
            arr.forEach(function (val) {
              if (typeof val === 'string') {
                a.push(val);
              } else if ('src' in val && val.src.indexOf('user_data') !== -1) {
                a.push(val.src);
              } else {
                throw new Error('图片格式错误');
              }
            });
            return a;
          }
          var itemsUpdateCount = 0; // 有多少的items需要更新
          var checkItemsUpdate = function () {
            
            $scope.items.forEach(function (val) {
              // 是否需要更新item, 用于只修改了标题或者描述或者时间时, 标记item需要被修改
              var updateItem = false,
              // 当item里有新的图片需要上传时, 用以表示有多少图片正在等待上传
                  waitPicture = 0;

              var i = getCachedItemsNo(val._id);

              // 判断标题, 时间, 描述 是否被更改
              if (!cachedItems[i] ||
                val.title !== cachedItems[i].title ||
                val.post !== cachedItems[i].post ||
                new Date(val.date).getTime() !== new Date(cachedItems[i].date).getTime() ||
                val.tag._id !== cachedItems[i].tag._id
                ) {

                updateItem = true;
              }

              // 是否有新图片
              if (cachedItems[i] && cachedItems[i].pictures) {
                cachedItems[i].pictures.forEach(function (pic, j) {
                  if (pic !== val.pictures[j]) {
                    updateItem = true;
                  }
                });
              }

              // 遍历图片数组找到需要新上传的图片
              val.pictures.forEach(function (pic, j) {
                if (typeof pic !== 'string' && (!('loaded' in pic))) {
                  
                  waitPicture++;
                  (function (index) {
                    var fd = new FormData();

                    var url = 'picture/save',
                        uploadType = 'file';
                    // 如果没有达到需要压缩的大小则直接上传
                    if (($scope.quality.code === 1 && Math.max(pic.img.width, pic.img.height) > 1440) ||
                      ($scope.quality.code === 0 && Math.max(pic.img.width, pic.img.height)) > 1024) {
                      var img = Util.getCompressedImage(pic.src, $scope.quality.code, pic.file.type);
                      uploadType = 'base64';
                      window.test = img;
                      fd.append('image', img.substr(img.indexOf('base64,') + 'base64,'.length));
                      fd.append('oriname', pic.file.name);
                      url += '/base64';
                    } else {
                      fd.append('image', pic.file);
                    }
                    
                    fd.append('type', uploadType);
                    fd.append('itemId', val._id);
                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', url);
                    xhr.onload = function () {
                      var result = JSON.parse(xhr.response);
                      if (result.status === -1) {
                        // TODO
                        return alert('上传失败');
                      }
                      val.pictures[index] = result.data.url;
                      // 上传完成后, 减少一个正在等待上传的图片: waitPicture--
                      finishPicture();
                    };
                    xhr.send(fd);
                  })(j);
                }
              });

              // 如果这个item需要更新, 则将需要做的更新计数器+1
              if (updateItem || waitPicture) {
                itemsUpdateCount++;
                totalUpdateCount++;
              }

              lastStep = true;
              
              // 减少一个正在上传的图片, 如果所有图片上传完成, 则下一步: 更新item
              var finishPicture = function () {
                if (--waitPicture > 0) return;
                doUpdateItem();
              },
              // 更新item
              doUpdateItem = function () {
                $http({
                  method: 'post',
                  url: 'item/alter',
                  data: {
                    _id: val._id,
                    post: val.post,
                    tag: val.tag._id || val.tag.id,
                    title: val.title,
                    pictures: getPictureUrls(val.pictures),
                    date: val.date
                  }
                }).
                success(function (data) {
                  if (data.status === 1) {
                    finishTotalUpdate('picture');
                    doFinishItems();
                  }
                });
              };

              // 如果没有新上传的图片又需要更新item, 则直接做更新item操作
              // 因为如果有新的图片需要上传, 需要等到所有图片上传完成, 并拿到这些图片的地址后, 才能更新item
              if (!waitPicture && updateItem) {
                doUpdateItem();
              }

            });
          };

          // 删除items
          var deleteItems = function (callback) {
            var deleted = [];

            cachedItems.forEach(function (val) {
              var id = val._id,
                  found = false;
              $scope.items.forEach(function (_val) {
                if (_val._id === id) {
                  found = true;
                }
              });
              if (!found) {
                deleted.push(val);
              }
            });

            var length = deleted.length;
            // delete request
            deleted.forEach(function (val) {
              $http({
                method: 'GET',
                url: 'item/delete?itemId=' + val._id
              }).success(function () {
                if (--length <= 0) {
                  typeof callback === 'function' && callback();
                }
              }).error(function () {
                alert('Error occured');
                return $scope.uploading = false;
              });
            });
          };

          // 判断是否有新的item需要创建
          // TODO 删除items
          deleteItems();
          var sq = new Utils.syncQueue();
          $scope.items.forEach(function (val, i) {
            if ('_id' in val) {
              return;
            }
            totalUpdateCount++;
            sq.push(function (args, next) {
              var tag = $scope.items[i].tag;
              $http({
                method: 'POST',
                url: 'item/create',
                data: {
                  markId: $scope.id,
                  date: new Date($scope.items[i].date).getTime(),
                  post: $scope.items[i].post,
                  title: $scope.items[i].title,
                  tag: tag.id
                }
              }).
              success(function (data) {
                finishTotalUpdate('create item');
                if (data.status === 1) {
                  $scope.items[i]._id = data.data.itemId;
                  next(null, data.data.itemId);
                }
              }).
              error(function () {
                finishTotalUpdate();
                $scope.uploading = false;
                next(new Error('Upload failed.'));
              });
            });
          });
          sq.push(function (args, next) {
            args && next;
            checkItemsUpdate();
          }).
          exec();

          function getCachedItemsNo(id) {
            var result = null;
            cachedItems.forEach(function (val, i) {
              if (result) return;
              if (val._id === id) result = i;
            });
            
            if (result === null) return -1;
            return result;
          }

          function doFinishItems() {
            if (--itemsUpdateCount > 0) return;
          }
        };

        setTimeout(function() {

          if (totalUpdateCount <= 0 && $scope.uploading && promises <= 0 && location.hash === '#upload/edit') {
            history.back();
            $scope.uploading = false;
          }
        }, 300);

        // 开始执行更新队列
        funcs.forEach(function (val) {
          val();
        });

        return;
      }

      // 为view添加一个正在上传的表示
      // 实际上应该直接使用$scope.uploading控制
      $('.upload-pictures').addClass('uploading');
      

      // 执行上传
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
              t.id = data.data.tagId;
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
          var itemId = args;
          var fd = new FormData();
          var uploadType = 'file';
          var url = '/picture/save';

          // 如果没有达到需要压缩的大小则直接上传
          if (($scope.quality.code === 1 && Math.max(pic.img.width, pic.img.height) > 1440) ||
            ($scope.quality.code === 0 && Math.max(pic.img.width, pic.img.height)) > 1024) {
            var img = Util.getCompressedImage(pic.src, $scope.quality.code, pic.file.type);
            uploadType = 'base64';
            window.test = img;
            fd.append('image', img.substr(img.indexOf('base64,') + 'base64,'.length));
            fd.append('oriname', pic.file.name);
            url += '/base64';
          } else {
            fd.append('image', pic.file);
          }
          fd.append('type', uploadType);
          fd.append('itemId', itemId);
          var xhr = new XMLHttpRequest();
          xhr.open('POST', url);
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

    // ---------- events ----------
    ModManager.addListener('before', function (mod) {
      if (mod !== 'upload' ) {
        return;
      }

      // 初始化view
      $scope.editMode = false;
      $scope.title = '';
      $scope.summary = '';
      $scope.locTags = [];
      $scope.items = Item.empty();

      // 编辑模式
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

      // 消化更改以渲染
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

        // 显示tips
        setTimeout(showTips, 300);
      }
    });

    // 在title的input按下enter的时候自动换到下一个input
    $('#upload-title-input').keydown(function (ev) {
      if (ev.keyCode === 13) {
        $('#upload-location-input').focus();
        ev.preventDefault();
      }
    });

    // location tag输入框按下回车时开始根据输入内容请求地理位置信息并生成tag
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

    // 每一个item旁边的标签被点击的时候
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

    // location输入框里的tag被点击的时候
    $('.location-tags-container').delegate('.location-tag', 'click', function (ev) {
      preventReload = true;
      while(! ('itemOrder' in ev.target.dataset)) ev.target = ev.target.parentNode;
      var e = ev.target,
          selector = document.getElementsByClassName('upload-location-selector')[0];
      var order = +e.dataset.itemOrder;
      lsScope.selectIndex = 0;
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

      document.querySelector('.upload-location-selector .selector-input-pos').focus();
      // 选择框被关闭
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
        $('.selector-results .select').removeClass('.select');
        lsScope.show = false;
        clonedElement[0]._bindElement = null;
        $scope.locTags[lsScope.order].name = lsScope.inputName;
        $scope.$digest();
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

    // 拖动上传图片
    area('drop to upload pictures', function () {
      // 是否已经设置了可以拖动的提示
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

      // 拖动图片事件
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

    });

    // focus处理，包括对焦点元素添加highlight背景等
    $('#mod-upload .item').delegate('input, textarea', 'focus', function (ev) {
      ev.target.parentElement.classList.add('focus');
    });
    $('#mod-upload .item').delegate('input, textarea', 'blur', function (ev) {
      ev.target.parentElement.classList.remove('focus');
    });
    // 点击到整个输入框时把焦点移动到该输入框的input上
    $('#mod-upload .item').click(function (ev) {
      if (!$(ev.target).hasClass('item')) {
        ev.target = ev.target.parentElement;
      }
      var input = ev.target.getElementsByTagName('input')[0] || ev.target.getElementsByTagName('textarea')[0] || ev.target.parentNode.parentNode.getElementsByTagName('input')[0];
      input.focus();
    });

    // 日期选择器
    area('date picker', function () {
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
    });


    // 用于读取文件的input内容被更改了，做相应的处理
    // TODO: 这样的事件用户重复选择文件就不会起效果
    angular.element('.upload-input')[0].addEventListener('change', function (ev) {
      var fr = new FileReader();
      fr.onload = function () {
        $scope.items[currentUploadTarget].pictures.push(Item.picture(this.result, ev.target.files[0]));
        $scope.$digest();
        angular.element('.upload-input')[0].value = null;
      };
      fr.readAsDataURL(ev.target.files[0]);
    }, false);

    // location tag selector
    var ltsScope,
        lts_ce;

    // location input
    var lsScope,
        clonedElement,
        preventReload = true;
    // location 输入框相关
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
      var e = angular.element('<div ng-show="show" class="upload-location-selector"><div class="selector-nav"><span class="selector-result"><i class="icon-white icon-map-marker"></i><span ng-bind-template="{{result}}" class="result-text"></span></span></div><div class="input-wrap"><input ng-model="inputName" type="text" class="selector-input-name" /></div><div class="input-wrap location"><input type="text" class="selector-input-pos" ng-model="inputPos" /></div><div class="selector-results"><div class="results-item" ng-repeat="it in results" data-item-order="{{$index}}" ng-bind-template="{{it.formatted_address}}"></div><div class="results-footer" ><div ng-click="deleteTag()" class="delete">Delete this tag</div><div class="results-num" ng-bind-template="{{results.length}} result(s)"></div><div class="clear"></div></div></div></div>');
      clonedElement = $compile(e)(lsScope, function (clonedElement, scope) {
        document.body.appendChild(clonedElement[0]);
        var list = clonedElement[0].getElementsByClassName('selector-results')[0];
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
        var eleInputPos = clonedElement[0].getElementsByClassName('selector-input-pos')[0];
        eleInputPos.addEventListener('keydown', function (ev) {
          var _list = list.getElementsByTagName('div');
          switch (ev.keyCode) {
            case 38:// up
              $(_list[lsScope.selectIndex]).removeClass('selected');
              lsScope.selectIndex = Math.max(lsScope.selectIndex - 1, 0);
              $(_list[lsScope.selectIndex]).addClass('selected');
              break;
            case 40:// down
              $(_list[lsScope.selectIndex]).removeClass('selected');
              lsScope.selectIndex = Math.min(lsScope.selectIndex + 1, _list.length - 1);
              $(_list[lsScope.selectIndex]).addClass('selected');
              break;
            case 13: //enter
              _list[lsScope.selectIndex].click();
              break;
          }
        });
        var junk = document.createElement('div');
        var req = new google.maps.places.PlacesService(junk);
        var throttle_t,
            throttle_count,
            THROTTLE_CD = 300;

        lsScope.$watch('inputName', function (newVal, oldVal) {
          if (!$scope.locTags || !lsScope.order) return;
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

  }]);