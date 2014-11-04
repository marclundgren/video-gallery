/* global m */
/* global Velocity */

// todo: stylesheet

(function(global) {
  'use strict';

  var app = {};

  app.autoplay = false;
  app.title = 'FIDM Video Gallery - now supporing JSONP!';
  app.velocity = Velocity;
  app.videoWidth = 108;

  app._OFFSET = 14;

  // Model
  app.Video = function(data) {
    this.thumbnail  = m.prop(data.src);
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

    videoPlayer.syncScroll = function(element) {
      if (document.body.scrollTop > element.offsetTop) {
        document.body.scrollTop = (element.offsetTop - app._OFFSET);
      }
    };

    videoPlayer.fadeIn = function(element, isInitialized) {
      if (!isInitialized) {
        var videoEl = element.getElementsByTagName('video')[0];

        videoEl.style.width = app.videoWidth + 'px';

        app.velocity(videoEl, {width: '100%'}, {
          complete: function() {
            element.focus();
          }
        });
      }
    };

    videoPlayer.view = function() {
      var video = app.vm.selectedVideo();

      return video ? [
        m('div', {
          tabindex: -1,
          config: function(element) {
            videoPlayer.syncScroll(element);

            videoPlayer.fadeIn.apply(this, arguments);
          },
          style: {display: 'inline-block', width: '100%', maxWidth: '640px'}
        }, [
          m('video', {
            autoplay: app.autoplay,
            controls: true,

            onkeypress: function(e) {
              if (e.keyCode !== 9) {
                // preserve video controls

                // e.preventDefault();
                e.stopPropagation();
                // e.stopImmediatePropagation();
              }
            },
            poster: video.poster(),
            style: {width: '100%', maxWidth: '640px'}
          }, [
            m('source', { src: video.mp4(),  type: 'video/mp4'  }),
            m('source', { src: video.webm(), type: 'video/webm' }),
            m('source', { src: video.ogg(),  type: 'video/ogg'  })
          ]),
          m('h3', video.title()),
          m('div.content', video.content())
        ])
      ] : m('');
    };

    return videoPlayer;
  };

  app.search = function() {
    var search = {};

    search.fuzzy = function(str, match) {
      // todo : memoize/cache

      // normalize
      str   = str.toLowerCase();
      match = match.toLowerCase();

      var pattern = match.split('').reduce(function(a,b) {
        return (a + '.*' + b);
      });

      return (new RegExp(pattern)).test(str);
    };

    search.view = function(ctrl) {
      return m('div', [
        m('input', {
          type: 'search',
          onkeyup: function(event) {
            app.vm.selectedVideo(null);

            ctrl.binds(event.currentTarget.value);
          },
          value: app.vm.filterQuery()
        }),
        m('i.fa.fa-search')
      ]);
    };

    return search;
  };

  app.videoList = function() {
    var videoList = {};

    videoList.keyUp = function(e) {
      var keyCode = e.keyCode;

      if (keyCode === 39 || keyCode === 40) {
        e.preventDefault();

        e.currentTarget.firstChild.focus();
      }
    };

    videoList.item = {};
    videoList.item.keyUp = function(e) {
      var keyCode = e.keyCode;

      e.preventDefault();
      e.stopPropagation();

      // down, right arrow
      if (keyCode === 39 || keyCode === 40) {
        if (e.currentTarget.nextSibling) {
          e.currentTarget.nextSibling.focus();
        }
      }
      // up, left arrow
      else if (keyCode === 37 || keyCode === 38) {
        if (e.currentTarget.previousSibling) {
          e.currentTarget.previousSibling.focus();
        }
      }
    };

    videoList.view = function(ctrl) {
      var data = ctrl.data();

      return [
        data ? m('ul', {
            style: {padding: 0, display: 'inline-block'}
          }, [
          data.filter(app.vm.filter).map(function(video, index) {
            var selectedVideo = app.vm.selectedVideo();

            if (selectedVideo && (video.title() === selectedVideo.title())) {
              return m('li', {
                  style: {display: 'block', width: 'auto'},
                  onkeypress: videoList.item.keyUp,
                  tabindex: -1
                }, [
                m('hr'),
                app.vm.videoPlayer.view()
              ]);
            }

            return m('li', {
                style: {cursor: 'pointer', display: 'block', width: 'auto'},
                tabindex: (index === 0) ? 0 : -1,
                onkeyup: videoList.item.keyUp,
                onkeypress: function(e) {
                  var keyCode = e.keyCode;

                  e.preventDefault();
                  e.stopPropagation();

                  // enter
                  if (keyCode === 13) {
                    ctrl.binds(video);
                  }
                },
                onclick: function() {
                  ctrl.binds(video);
                }
              }, [
              m('hr'),
              m('div', {style: {
                position: 'relative', display: 'inline-block'
              }}, [
                m('img.thumbnail', {src: video.thumbnail(), width: app.videoWidth}),
                m('div.duration', {style: {
                  backgroundColor: '#000',
                  bottom: '6px',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  opacity: 0.75,
                  padding: '0px 4px',
                  position: 'absolute',
                  right: '2px'
                }}, video.duration())
              ]),
              m('h5', {style: {
                marginTop: 0
              }}, video.title())
            ]);
          })
        ]) : m('div', 'I could not find any videos.')
      ];
    };
    return videoList;
  };

  // View Model
  app.vm = {};

  app.vm.init = function() {
    this.search = new app.search();
    this.videoPlayer = new app.videoPlayer();
    this.videoList = new app.videoList();

    m.startComputation();
    this.get('../videos.jsonp?jsoncallback=processJSON').then(function(promisedData) {
      app.vm.videos = m.prop(promisedData.result.videos.map(function(item) {
        return new app.Video(item);
      }));

      m.endComputation();
    });

    this.selectedVideo = m.prop();
    this.filterQuery = m.prop('');

    window.app = app; // testing
  };

  // a derivative of thwang1206's method: http://git.io/pUyaYQ
  app.vm.getParams = function(url) {
    var vars = {};

    url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value){
        vars[key] = value;
    });
    return vars;
  };

  app.vm.jsonp = function(config) {
    config = config || {};

    var url = config.url || '';
    var callbackKey = config.callbackKey || app.vm.getParams(url).jsoncallback || 'callback';

    var promise = new Promise(function(resolve, reject) {
      if (typeof global[callbackKey] !== 'undefined') {
        reject(Error('callback key ' + callbackKey + ' already exists'));
      }
      else {
        var request = m.request({
          background: true,
          dataType: 'jsonp',
          method: config.method || 'GET',
          url: url
        });

        global[callbackKey] = function(result) {
          resolve({result: result, request: request});
        };
      }
    });

    promise.then(function() {
      delete global[callbackKey];
    });

    return promise;
  };

  app.vm.get = function(url) {
    return app.vm.jsonp({ url: url });
  };

  app.vm.filter = function(item) {
    var match;

    var filterQuery = app.vm.filterQuery();

    if (filterQuery) {
      match = app.vm.search.fuzzy(item.title(), filterQuery);
    }
    else {
      match = true;
    }

    return match;
  };

  // Controller
  app.controller = function() {};

  // View
  app.view = function() {
    var vm = app.vm;

    return m('div', {
        style: {
          maxWidth: '800px'
        }
      }, [
      m('h1', app.title),
      vm.search.view({data: vm.videos, binds: vm.filterQuery}),
      vm.videoList.view({data: vm.videos, binds: vm.selectedVideo})
    ]);
  };

  // Init
  app.vm.init();

  // Draw
  m.module(document.getElementById('app'), {controller: app.controller, view: app.view});
})(window);