/* global m */
/* global Velocity */

// todo: stylesheet

(function(global) {
  'use strict';

  var app = {};

  app.autoplay = false;
  app.paginateURL = 'http://fidm.edu/wps/wcm/connect/wmo%20content/en/about/fidm%20video%20gallery?WCM_PI=1&cmpntid=eca581a8-c028-48fa-a7ea-e52402f494fe&srv=cmpnt&source=library&WCM_Page.eca581a8-c028-48fa-a7ea-e52402f494fe={page}';

  app.velocity = Velocity;
  app.videoWidth = 108;

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

    videoPlayer.fadeIn = function(element, isInitialized) {
      if (!isInitialized) {
        var videoEl = element.getElementsByTagName('video')[0];

        videoEl.style.width = app.videoWidth + 'px';

        app.velocity(videoEl, {width: '100%'}, {
          complete: function() {
            videoEl.focus();
          }
        });
      }
    };

    videoPlayer.view = function() {
      var video = app.vm.selectedVideo();

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
            autoplay: app.autoplay,
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

    app.vm.nextPageURL = function(page) {
      return app.sub(app.paginateURL, {page: page + 1});
    };

    videoList.next = {};

    videoList.next.fetch = function() {
      var vm = app.vm;

      var page = vm.currentPage();

      if (!videoList._loading) {
        videoList._loading = true;

        m.startComputation();

        var promise = vm.get(vm.nextPageURL(page));

        promise.then(function(promisedData) {
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
        data ? m('ul.videoList', {
            style: {
              textAlign: 'right'
            }
          }, [
          data.map(function(video, index) {
            var selectedVideo = app.vm.selectedVideo();

            if (selectedVideo && (video.title() === selectedVideo.title())) {
              return m('li', {
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

                      ctrl.binds(null);
                    }
                  },
                  tabindex: -1
                }, [
                m('hr'),
                app.vm.videoPlayer.view()
              ]);
            }

            return m('li', {
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
                m('img.thumbnail', {
                  style: {
                    textAlign: 'right',
                    marginBottom: 0 // bootstrap :/
                  },
                  src: video.thumbnail(),
                  width: app.videoWidth
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
                  right: '2px'
                }}, video.duration())
              ]),
              m('h5', {
                style: {
                  marginTop: 0,
                  textAlign: 'left'
                }
            }, app.strip(video.title()))
            ]);
          }),
          videoList.next.view()
        ]) : m('div', 'I could not find any videos.')
      ];
    };

    videoList.init();

    return videoList;
  };

  // View Model
  app.vm = {};

  app.vm.init = function() {

    this.currentPage = m.prop(0);
    this.videoPlayer = new app.videoPlayer();
    // this.videoList = new app.videoList();
    this.videos = m.prop([]);
    this.selectedVideo = m.prop();
    this.filterQuery = m.prop('');
  };

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

  // a derivative of thwang1206's method: http://git.io/pUyaYQ
  app.vm.getParams = function(url) {
    var vars = {};

    url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value){
        vars[key] = value;
    });
    return vars;
  };

  // TODO apply this: https://github.com/lhorie/mithril.js/issues/329#issuecomment-61752753
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

  // Controller
  app.controller = function() {};

  // View
  app.view = function() {
    var vm = app.vm;

    return m('test')
    // return vm.videoList.view({data: vm.videos, binds: vm.selectedVideo});
  };

  // Init
  app.vm.init();

  // Runtime Developing
  window.app = app;

  // app._url = app.vm.nextPageURL(0);
  // console.log('app._url: ', app._url);

  m.request({
    callbackKey: 'jsoncallback',
    // callbackName: 'callback',
    dataType: 'jsonp',
    method: 'GET',
    url: 'http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=processJSON&tags=monkey&tagmode=any&format=json',
    _url: 'http://fidm.edu/wps/wcm/connect/wmo%20content/en/about/fidm%20video%20gallery?jsoncallback=callbackWCM_PI=1&cmpntid=eca581a8-c028-48fa-a7ea-e52402f494fe&srv=cmpnt&source=library&WCM_Page.eca581a8-c028-48fa-a7ea-e52402f494fe=1'
  }).then(function(d) {
    console.log('d: ', d);

  });

  // Draw
  m.module(document.getElementById('app'), {controller: app.controller, view: app.view});
})(window);