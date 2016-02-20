(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

// $(document).ready(function() {
//   $("#next-word-textbox").focus();

//   $("#next-word-textbox").change(function(event) {
//     parseUserWord();
//   });

//   $("#next-word-textbox").keyup(function(event) {
//     var str = $("#next-word-textbox").val();
//     if (event.keyCode==13 && !str.match(/.* .*/)) { //Enter
//       submitWord();
//     }
//     parseUserWord();
//   });
// });

// function parseUserWord() {
//     $("#next-word").text($("#next-word-textbox").val());
//     var str = $("#next-word-textbox").val();
//     if(!str.match(/.* .*/)) {
//       $("#next-word").addClass("green");
//       $("#user-message").text("");
//       $("#user-message").removeClass("pink");
//       $("#next-word").removeClass("pink");
//     } else {
//       $("#user-message").text("Words can only contain letters and numbers. No whitespace or special characters.");
//       $("#next-word").removeClass("green");
//       $("#user-message").removeClass("green");
//       $("#next-word").addClass("pink");
//       $("#user-message").addClass("pink");

//     }
// }

// function submitWord() {
//   $("#next-word-textbox").hide();
//   $("#user-message").text("Your word has been submitted! Wait another 10 seconds to try and play the next word.");
//   $("#user-message").removeClass("pink");
//   $("#user-message").addClass("green");
// }

// // $("#next-word").animate({backgroundColor: '#b3ffda'}, {
// //         duration: 2000,
// //         queue: false
// //       });
var sentencifyApp = angular.module('sentencifyApp', ['ngRoute', 'sentencifyControllers']);
sentencifyApp.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/home', {
    templateUrl: 'partials/home.html',
    controller: 'HomeController'
  }).when('/sentences', {
    templateUrl: 'partials/sentences.html',
    controller: 'SentencesController'
  }).otherwise({
    redirectTo: '/home'
  });
}]);

},{}]},{},[1]);
