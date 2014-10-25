/* global m */

(function() {
  'use strict';

  var app = {};

  // Model
  app.Video = function(data) {
    this.thumbnail  = m.prop(data.src);
    this.altTitle   = m.prop(data.altTitle);
    this.title      = m.prop(data.title);
    this.mp4        = m.prop(data.mp4);
    this.webm       = m.prop(data.webm);
    this.ogg        = m.prop(data.ogg);
    this.flash      = m.prop(data.flash);
    this.duration   = m.prop(data.duration);
    this.poster     = m.prop(data.poster);
    this.content    = m.prop(data.content);
  };

  // View Model
  app.vm = {};

  app.vm.init = function() {
    this.videos = m.request({method: 'GET', url: 'data.json', type: app.Video});

    this.selectedVideo = m.prop();
  };

  // Controller
  app.controller = function() {
    this.loadVideos = function() {
      if (!app.vm.videos) {
        app.vm.init();
      }
    };
  };

  // View
  app.view = function(ctrl) {
    return [
      m('button[type=button]', {onclick: ctrl.loadVideos}, 'Load videos'),
        app.vm.videos ? m('ul', [
          app.vm.videos().map(function(video) {
            return m('li', [
                m('h3', video.title()),
                m('video', {src: video.ogg(), controls: true}),
                m('div.duration', video.duration())
              ]
            );
        })
      ]) : ''
    ];
  };

  m.module(document.getElementById('app'), {controller: app.controller, view: app.view});
})();