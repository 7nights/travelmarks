'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('SignInCtrl', ['$scope', '$http', 'ModManager', 'Util', 'User', function ($scope, $http, ModManager, Util, User) {
    $scope.loginBoxDesc = 'Sign up right now!';
    $scope.loginBtn = 'Sign In';
    $scope.showEmail = false;
    $scope.errorMessage = '';
    var signupMode = false;
    $scope.signUp = function (ev){
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
    $scope.submit = function (ev){
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

      if (!signupMode) {
        $http({method: 'POST', url: '/signin', data: {
          name: $scope.inputUsername,
          passwd: hex_md5($scope.inputPassword)
        }}).
          success(function (data, status, headers, config) {
            // TODO
            if (data.status === 1) {
              if(User.eatCookie()){
                window.location.hash = 'home';
              }
            } else {
              window.location.hash = '';
              $scope.errorMessage = data.message;
            }
          }).
          error(function () {
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
            if (data.status === 1) {
              $scope.errorMessage = '创建成功~';
              $scope.inputPassword = '';
              $scope.signUp();
            } else {
              window.location.hash = '';
              $scope.errorMessage = data.message;
            }
          }).
          error(function () {
            // TODO
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
  controller('NavCtrl', ['$scope', '$http', 'User', function ($scope, $http, User) {
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

    document.getElementById('signIn-cover').src = 'img/samples/' + Math.round(Math.random() * 6 + 1) + '.jpg';

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
  controller('DetailCtrl', ['$scope', '$http', 'HashManager', 'ModManager', function ($scope, $http, HashManager, ModManager) {
    
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
        }
      } else {
        return;
      }

      $http({
        method: 'GET',
        url: 'mark/getMark',
        params: {
          id: HashManager.getArgs().id
        }
      }).
      success(function (data) {
        if (data.status !== -1) {
          $scope.title = data.title;
          $scope.location = data.location;
          $scope.read = data.read;
          $scope.author = data.author;
          $scope.summary = data.summary;
          $scope.total = data.total;
          $scope.date = data.date;
          
          // parse data.items
          $scope.items = [];
          data.items.forEach(function (val) {
            var it = Item.one();
            it.post = val.post;
            it.title = val.title;
            it.date = val.date;
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
    });
  
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
  controller('UploadCtrl', ['$scope', '$http', 'ModManager', 'Item', '$q', 'Util', function ($scope, $http, ModManager, Item, $q, Util) {
    // init && clean up
    ModManager.addListener('before', function (mod) {
      if (mod === 'upload' ) {
        $('#upload-title-input').focus();
        document.getElementById('upload-title-input').focus();
      }
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
      }
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
      var input = ev.target.getElementsByTagName('input')[0] || ev.target.getElementsByTagName('textarea')[0];
      input.focus();
    });

    var picker;
    $('.item-box').delegate('.it-post-date', 'focus', function (ev) {
      var input = ev.target;
      input.blur();
      if (picker) return;
      picker = Util.getDatePicker(null, function (date) {
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
        var fr = new FileReader();
        fr._file = files[i];
        fr.onload = function () {
          $scope.items[getItemOrder(ev.target)].pictures.push(Item.picture(this.result, this._file));
          $scope.$digest();
        }
        fr.readAsDataURL(files[i]);
        testExif(files[i], ev.target);
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
        return p.progress / 100 * 216 + 'px'
      }
      return 220 + 'px';
    };


    $scope.uploading = false; // 是否处于上传中, 用来已经开始上传任务后disable按钮
    $scope.ifUploading = function () {
      $scope.uploading ? 'disable-buttons' : '';
    };
    $scope.demoUploadFinished = 0;
    // save 按钮
    $scope.save = function () {
      if ($scope.uploading) return;
      $scope.uploading = true;
      $('.upload-pictures').addClass('uploading');
      
      var sq = new Utils.syncQueue(),
          markId;
      sq.
      // step 1: create mark
      push(function (args, next) {
        console.log(JSON.stringify({
            title: $scope.title,
            summary: $scope.summary,
            location: $scope.location
          }));
        $http({
          method: 'POST',
          url: 'mark/create',
          data: JSON.stringify({
            title: $scope.title,
            summary: $scope.summary,
            location: $scope.location
          })
        }).
        success(function (data, status, headers, config) {
          $scope.uploading = false;
          if (data.status === -1) {
            // throw error
            return next(data);
          }
          // next step
          markId = data.data.markId;
          next(null, data.data.markId);
        }).
        error(function () {
          $scope.uploading = false;
          // TODO: styled alert
          alert('Upload failed. Please try again later.');
        });
      });
      // step 2: create item & upload pictures
      
      function createItem(_i) {
        var itemId;
        // step 2.1: create item
        sq.push(function (args, next) {
          
          $http({
            method: 'POST',
            url: 'item/create',
            data: {
              markId: markId,
              date: new Date($scope.items[_i].date).getTime(),
              post: $scope.items[_i].post,
              title: $scope.items[_i].title
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
        // step 2.2: upload pictures
        $scope.items[_i].pictures.forEach(function (val, i) {
          uploadPicture(itemId, val, i);
          $scope.demoUploadFinished++;
        });
      }
      function uploadPicture(itemId, pic, _i) {
      
        sq.push(function (args, next) {
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
            next(null, args);
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
        if ($scope.demoUploadFinished > 0) {
          return setTimeout(temp, 200);
        }
        $scope.uploading = false;
        $('.upload-pictures').removeClass('uploading');
        $scope.uploading = false;
        $scope.items = Item.empty();
        $scope.title = '';
        $scope.summary = '';
        $scope.location = '';
        try {
          $scope.$digest();
        } catch(e) {}
        location.hash = 'detail/' + markId;
      }).
      // TODO: error handler
      push(function (err, args, next) {

        if (!err) {
          return next(null, args);
        }
        if (typeof err === 'object' && 'status' in err) {
          alert(err.message);
        }
      }).
      exec();
    };

    // 点击上传图片按钮
    var currentUploadTarget = 0;
    $scope.upload = function (ev) {
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