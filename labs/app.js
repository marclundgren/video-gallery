/* global m */

(function() {
  'use strict';

  var app = {};

  // Model
  app.Video = function(data) {
    var url = '//fidm.edu/'; // temp

    this.thumbnail  = m.prop(url + data.src);
    this.altTitle   = m.prop(data.altTitle);
    this.title      = m.prop(data.title);
    this.mp4        = m.prop(data.mp4);
    this.webm       = m.prop(data.webm);
    this.ogg        = m.prop(data.ogg);
    this.flash      = m.prop(data.flash);
    this.duration   = m.prop(data.duration);
    this.poster     = m.prop(url + data.poster);
    this.content    = m.prop(data.content);
  };

  app.videoPlayer = function() {
    var videoPlayer = {};

    videoPlayer.vm = {};

    videoPlayer.vm.init = function() {
      this.video = m.prop();
    };

    videoPlayer.view = function(ctrl) {
      var video = app.vm.selectedVideo();

      if (video) {
        return [
          m('div', [
            m('video', {controls: true, poster: video.poster(), src: video.ogg()}),
            m('h1', video.title()),
            m('div.content', video.content()),
            m('hr')
          ])
        ];
      }
      else {
        return m('');
      }

    };
    return videoPlayer;
  };

  app.videoList = function() {
    var videoList = {};
    videoList.view = function(ctrl) {

      var data = ctrl.data();

      return [
        app.vm.videos ? m('ul', [
          app.vm.videos().filter(app.vm.filter).map(function(video) {
            return m('li', {style: {display: 'block'}, onclick: ctrl.binds.bind(this, video)}, [
              m('img.thumbnail', {src: video.thumbnail()}),
              m('h4', video.title()),
              m('div.duration', video.duration())
            ]);
          })
        ]) : ''
      ];
    };
    return videoList;
  };

  // View Model
  app.vm = {};

  app.vm.init = function() {
    this.videoPlayer = new app.videoPlayer();
    this.videoList = new app.videoList();

    this.videos = m.request({method: 'GET', url: '../data.json', type: app.Video});

    this.selectedVideo = m.prop();

    this.initialized = true;
  };

  app.vm.filter = function(item) {
    var filter = false;

    var selectedVideo = app.vm.selectedVideo();

    if (selectedVideo) {
      filter = selectedVideo.title() === item.title();
    }

    return !filter;
  };

  // Controller
  app.controller = function() {
    this.loadVideos = function() {
      if (!app.vm.initialized) {
        app.vm.init();
      }
    };
  };

  app.vm.init();

  // View
  app.view = function(ctrl) {
    var vm = app.vm;

    return m('div', [
        vm.videoPlayer.view(),
        vm.videoList.view({data: vm.videos, binds: vm.selectedVideo}),
    ]);
  };

  m.module(document.getElementById('app'), {controller: app.controller, view: app.view});
})();