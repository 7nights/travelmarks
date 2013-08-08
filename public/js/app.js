'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'myApp.controllers', 'HashManager', 'ngCookies']).
  run(["HashManager", "ModManager", 'User', '$cookieStore', function (HashManager, ModManager, User, $cookieStore) {
    
    // User
    if ($cookieStore.get('userinfo')) {

      var user = $cookieStore.get('userinfo');

      User.name = user.name;
      User.email = user.email;
      User._csrf = user._csrf;
      $cookieStore.remove('userinfo');
      User.$digest();
    }

    ModManager.initMod = "signIn";
    HashManager.addListener("", function(args){
      if(User.name){
        location.hash = "home";
        return;
      }

      ModManager.enter("signIn");
    }, -1);
    HashManager.addListener("upload", function () {
      ModManager.enter("upload");
    });
    HashManager.addListener("back", function () {
      HashManager.slience();
      history.back();
    });
    HashManager.addListener('home', function () {
      ModManager.enter('home');
    });
    HashManager.addListener('home/:refresh', function () {
      ModManager.enter('home');
    });
    HashManager.addListener('detail/:id', function (args) {
      ModManager.enter('detail');
    });

    ModManager.addListener('start', function (mod) {
      // auth required
      if ((mod === 'upload' || mod === 'home') && !User.email) {
        //location.hash = '';
        return '#';
      }

      // 导航条按钮底色控制
      document.getElementById('nav-btn-home').classList.remove('active');
      if (mod === 'home') {
        document.getElementById('nav-btn-home').classList.add('active');
      }
    });

    HashManager.other(function(){
      if(User.username){
        location.hash = "home";
        return;
      }
      location.hash = "";
    });
  }]);
