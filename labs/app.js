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

  app.videoPlayer = function() {
    var videoPlayer = {};

    videoPlayer.vm = {};

    videoPlayer.vm.init = function() {
      this.video = m.prop();
    };

    videoPlayer.view = function(ctrl) {
      var video = app.vm.video;

      // var data = ctrl.data;
      // console.log('data: ', data);

      if (video) {
        return [
          m('div', [
            m('h1', video.title()),
            m('video', {src: video.ogg(), controls: true}),
            m('div.content', video.content())
          ])
        ];
      }
      else {
        return m('div', 'Please select a video.');
      }

    };
    return videoPlayer;
  };

  app.videoList = function() {
    var videoList = {};
    // videoList.vm = {};
    videoList.view = function(ctrl) {
      return [
        app.vm.videos ? m('ul', [
          app.vm.videos().map(function(video) {
            return m('li', [
              m('h4', video.title()),
              m('div.duration', video.duration())
            ],
            ctrl.data().filter(app.vm.filter).map(function(item) {
              return m('div', {onclick: ctrl.binds.bind(this, item)}, item.title);
            })
            );
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

    this.videos = m.request({method: 'GET', url: 'data.json', type: app.Video});

    this.selectedVideo = m.prop();

    this.initialized = true;
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
        m('button[type=button]', {onclick: ctrl.loadVideos}, 'Load videos'),
        vm.videoPlayer.view(),
        vm.videoList.view({data: vm.videos, binds: vm.selectedVideo}),
    ]);
  };

  app._view = function(ctrl) {
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