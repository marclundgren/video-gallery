/* global m */
/* global Velocity */

// todo: stylesheet

(function(global) {
  'use strict';

  var app = {};

  app.velocity = Velocity;

  app.guid = (function() {
    // credit: http://stackoverflow.com/a/105074
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
                 .toString(16)
                 .substring(1);
    }
    return function() {
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
             s4() + '-' + s4() + s4() + s4();
    };
  })();

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
    // this.id         = m.prop(app.guid());
    this.id         = m.prop(data.title + data.duration);
    // console.log('this.id: ', this.id());

    this.url; // name + site path
  };

  app.videoPlayer = function() {
    var videoPlayer = {};

    videoPlayer.vm = {};

    videoPlayer.vm.init = function() {
      this.video = m.prop();
    };

    videoPlayer.fadeIn = function(element, isInitialized) {
      if (!isInitialized) {
        var videoEl = element.getElementsByTagName('video')[0];

        videoEl.style.width = app.vm.videoWidth() + 'px';

        app.velocity(videoEl, {width: '100%'}, {
          complete: function() {
            videoEl.focus();
          }
        });
      }
    };

    videoPlayer.controller = function() {
      console.log('videoPlayer controller...');
    };

    videoPlayer.autoplay = m.prop(false);

    videoPlayer.view = function(controller) {
      // var video = app.vm.selectedVideo();
      var video = controller.video;
      console.log('controller.video: ', controller.video);

      if (!video) {
        console.log('no video :(', controller);
        debugger;
      }

      return video ? [
        m('div', {
          config: function(element) {
            videoPlayer.fadeIn.apply(this, arguments);
          },
          style: {
            display: 'inline-block',
            maxWidth: '640px',
            width: '100%'
          }
        }, [
          m('video', {
            autoplay: this.autoplay(),
            controls: true,
            style: {
              width: '100%', maxWidth: '640px'
            },
            onkeydown: function(event) {
              var keyCode = event.keyCode;

              // down, right arrow
              if (keyCode === 39 || keyCode === 40 || keyCode === 37 || keyCode === 38) {
                event.stopPropagation();
              }
            },
            poster: video.poster()
          }, [
            m('source', { src: video.mp4(),  type: 'video/mp4'  }),
            m('source', { src: video.webm(), type: 'video/webm' }),
            m('source', { src: video.ogg(),  type: 'video/ogg'  })
          ]),
          m('h3', app.strip(video.title())),
          m('div.content', app.strip(video.content()))
        ])
      ] : m('');
    };

    return videoPlayer;
  };

  app.strip = function(html) {
    // http://stackoverflow.com/a/822486
    var tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  app.sub = function(str, obj) {
    var keys = Object.keys(obj);

    keys.map(function(key) {
      var re = new RegExp('{' + key + '}', 'gm');

      str = str.replace(re, obj[key]);
    });

    return str;
  };

  app.array_flatten = function(arrays) {
    return [].concat.apply([], arrays);
  };

  app.videoList = function() {
    var BASE_INT = 10;

    var videoList = {};

    videoList.controller = function() {
      console.log('video list controller..');

      this.data = app.vm.videos;
    };

    videoList.init = function() {
      videoList.next.fetch();
    };

    videoList.keyUp = function(event) {
      var keyCode = event.keyCode;

      if (keyCode === 39 || keyCode === 40) {
        event.preventDefault();

        event.currentTarget.firstChild.focus();
      }
    };

    videoList.item = {};

    videoList.item.keyDown = function(event) {
      var keyCode = event.keyCode;

      if (keyCode === 39 || keyCode === 40 || keyCode === 37 || keyCode === 38) {
        event.preventDefault();
        event.stopPropagation();

        // down, right arrow
        if (keyCode === 39 || keyCode === 40) {
          if (event.currentTarget.nextSibling) {
            event.currentTarget.nextSibling.focus();
          }
        }
        // up, left arrow
        else if (keyCode === 37 || keyCode === 38) {
          if (event.currentTarget.previousSibling) {
            event.currentTarget.previousSibling.focus();
          }
        }
      }
    };

    videoList.next = {};

    videoList.next.fetch = function() {
      var vm = app.vm;

      var page = vm.currentPage();

      if (!videoList._loading) {
        videoList._loading = true;

        m.startComputation();

        var url = vm.url();

        var promise = vm.get(url);
        console.log('promise: ', promise);

        promise.then(function(promisedData) {
          console.log('promisedData: ', promisedData);
          videoList._loading = false;

          var result = promisedData.result;

          var videos = result.videos.map(function(item) {
            return new app.Video(item);
          });

          vm.videos(app.array_flatten([vm.videos(), videos]));
          vm.currentPage(parseInt(result.page, BASE_INT));

          m.endComputation();
        }, function(brokenPromise) {
          // Error(brokenPromise);

          videoList._loading = false;
        });

        return promise;
      }
      else {
        // debugging
        console.log('video list loading');
      }
    };

    videoList.next.view = function(ctrl) {
      return m('li.next', {
        onclick: function(event) {
          videoList.next.fetch();

          // event.currentTarget.onclick = null;

        },
        style: {
          cursor: 'pointer',
          display: 'block',
          width: 'auto'
        }
      }, [
        m('hr'),
        m('span', 'load more')
      ]);
    };

    videoList.view = function(ctrl) {
      var data = ctrl.data();

      return [
        data ? m('div.container.videoList', {
            style: {
              textAlign: 'right'
            }
          }, [
          data.map(function(video, index) {
            var selectedVideo = false;

            if (selectedVideo && (video.title() === selectedVideo.title())) {
              return m('div.row', {
                  style: {
                    display: 'block',
                    width: 'auto'
                  },
                  onkeydown: videoList.item.keyDown,
                  onkeypress: function(event) {
                    if (event.keyCode === 27) {
                      // esc, clear the video

                      event.preventDefault();
                      event.stopPropagation();

                      // ctrl.binds(null);
                    }
                  },
                  tabindex: -1
                }, [
                m('hr'),
                app.vm.videoPlayer.view()
              ]);
            }

            return m('div.row', {
                style: {
                  cursor: 'pointer',
                  display: 'block',
                  width: 'auto'
                },
                tabindex: (index === 0) ? 0 : -1,
                onkeydown: videoList.item.keyDown,
                onkeypress: function(event) {
                  var keyCode = event.keyCode;

                  // enter
                  if (keyCode === 13) {
                    event.preventDefault();
                    event.stopPropagation();

                    // ctrl.binds(video);
                  }
                },
                onclick: function() {
                  // ctrl.binds(video);
                  var id = video.id();
                  console.log('video.id: ', id);
                  m.route('/video/' + id);
                }
              }, [
              m('hr'),
              m('div.col-md-3.col-md-push-9',
                {
                  style: {
                    marginTop: 0,
                    textAlign: 'left'
                  }
                },
                app.strip(video.title())
              ),
              m('div.col-md-9.col-md-push-3', {style: {
                position: 'relative', display: 'inline-block'
              }}, [
                m('img.thumbnail', {
                  style: {
                    textAlign: 'right',
                    marginBottom: 0 // bootstrap :/
                  },
                  src: video.thumbnail(),
                  width: app.vm.videoWidth()
                }),
                m('div.duration', {style: {
                  backgroundColor: '#000',
                  bottom: '6px',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  opacity: 0.75,
                  padding: '0px 4px',
                  position: 'absolute',
                  left: '21px'
                }}, video.duration())
              ])
            ]);
          }),
          videoList.next.view()
        ]) : m('div', 'I could not find any videos.')
      ];
    };

    // videoList.init(); // idk??

    return videoList;
  };

  // View Model
  app.vm = {};

  app.vm.loadInitialVideos = function() {
    app.vm.loadVideos(this.currentPage());
  };

  app.vm.loadVideos = function(url) {
    m.startComputation();

    this.get(url).then(function(promisedData) {
      app.vm.videos(promisedData.result.videos.map(function(item) {
        return new app.Video(item);
      }));

      m.endComputation();
    });
  };

  app.vm.init = function() {
    this.currentPage = m.prop(0);
    this.videoPlayer = new app.videoPlayer();
    this.videoList = new app.videoList();
    this.videos = m.prop([]);
    this.selectedVideo = m.prop();
    this.filterQuery = m.prop('');
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
    return app.vm.jsonp({ callbackKey: 'processJSON', url: url });
  };

  // Controller
  app.controller = function() {};

  // View
  app.view = function() {
    var vm = app.vm;

    return m('div',
      m('h1', ''),
      vm.videoList.view({data: vm.videos, binds: vm.selectedVideo})
    );
  };

  // Init
  // app.vm.init();

  m.route.mode = 'search';

  var login = {
    controller: function() {
      this.id = 'login';
    },
    view: function(controller) {
      return m('div', [
        m('div', controller.id),
        m('a[href="/"', {config: m.route}, "home")
      ]);
    }
  };

  var dashboard = {
    controller: function() {
      this.id = 'dashboard';
    },
    view: function(controller) {
      return m('div', [
        m('div', controller.id),
        m('a[href="/"', {config: m.route}, "home")
      ]);
    }
  };

  //a sample module
  var home = {
    controller: function() {
      this.id = 'home';
    },
    view: function(controller) {
      return m('div', [
        m('div', controller.id),
        m('a.login', {
          onclick: m.route.bind(m.route, '/login')
        }, 'login'),
        m('a.dashboard', {
          onclick: m.route.bind(m.route, '/dashboard')
        }, 'dashboard')
      ]);
    }
  };

  var video = {
    controller: function() {
      this.id = m.route.param('videoID');

      this.video = app.vm.getVideoById(this.id);

      this.data = app.vm.videos; // some DRY
    },
    view: function(controller) {
      return m('div', [
        m('div', controller.id),
        app.vm.videoPlayer.view(controller),
        app.vm.videoList.view(controller)
      ]);
    }
  };

  app.vm.getVideoById = function(id) {
    var videos = vm.videos();

    if (videos.length) {
      for (var index = 0; index < videos.length; index++) {
        var video = videos[index];

        if (video.id() === id) {
          return video;
        }
      }
    }

    return null;
  };

  // app.vm = {};

  var vm = app.vm;

  vm.videoWidth = m.prop(108);
  vm.videos = m.prop([]);
  vm.videoList = new app.videoList();
  vm.videoPlayer = new app.videoPlayer();
  vm.fetch = vm.videoList.next.fetch;
  vm.currentPage = m.prop(1);
  vm.url = m.prop('http://fidm.edu/wps/wcm/connect/wmo%20content/en/about/fidm%20video%20gallery?cmpntid=550064f6-50bb-446e-bd88-52f7d18a7c40&source=library&srv=cmpnt&WCM_Page.ResetAll=TRUE&CACHE=NONE&CONTENTCACHE=NONE&CONNECTORCACHE=NONE');

  vm.fetch().then(function(stuff) {
    console.log('stuff: ', stuff);

    // var videoList = new app.videoList();
    // console.log('videoList: ', videoList);

    m.route(document.body, '/', {
      '/': vm.videoList,
      '/video/:videoID...': video
    });
  });

  // Runtime Developing
  window.app = app;

  // Draw
  // m.module(document.getElementById('app'), {controller: app.controller, view: app.view});
})(window);