'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', ['ngSanitize', 'myApp.filters', 'myApp.services', 'myApp.directives', 'myApp.controllers', 'HashManager', 'ngCookies']).
  run(["HashManager", "ModManager", 'User', '$cookieStore', function (HashManager, ModManager, User, $cookieStore) {
    
    // User
    if ($cookieStore.get('userinfo')) {

      var user = $cookieStore.get('userinfo');

      User.name = user.name;
      User.email = user.email;
      User._csrf = user._csrf;
      User.id = user.id;
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
    }, -1).
    addListener("upload", function () {
      ModManager.enter("upload");
    }).
    addListener("upload/:edit", function () {
      ModManager.enter("upload");
    }).
    addListener("back", function () {
      HashManager.slience();
      history.back();
    }).
    addListener('home', function () {
      ModManager.enter('home');
    }).
    addListener('home/:refresh', function () {
      ModManager.enter('home');
    }).
    addListener('detail/:id', function (args) {
      ModManager.enter('detail');
    }).
    addListener('explore', function () {
      ModManager.enter('explore');
    });
    
    ModManager.addListener('start', function (mod) {
      // auth required
      if ((mod === 'upload' || mod === 'home') && !User.email) {
        //location.hash = '';
        return '#';
      }

      // 导航条按钮底色控制
      document.getElementById('nav-btn-home').classList.remove('active');
      document.getElementById('nav-btn-explore').classList.remove('active');
      $('.nav .icon-white').removeClass('icon-white');
      if (mod === 'home') {
        document.getElementById('nav-btn-home').classList.add('active');
        document.querySelector('#nav-btn-home i').classList.add('icon-white');
      } else if (mod === 'explore') {
        document.getElementById('nav-btn-explore').classList.add('active');
        document.querySelector('#nav-btn-explore i').classList.add('icon-white');
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
