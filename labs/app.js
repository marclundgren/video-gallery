/* global m */
/* global Velocity */
/* jshint devel:true, strict:false */

// todo: move styles to stylesheet

(function(WINDOW, doc) {

  /*

  //a sample module
  var video = {
    controller: function() {
      this.id = m.route.param('videoID');
      console.log('video id: ', this.id);
    },

    view: function(controller) {
      console.log('controller: ', controller);
      return m('div', [
        m('div', {
          style: {
            padding: '1em',
            fontSize: '2em'
          }
        }, controller.id),
        videoList.view(controller)
      ]);
    }
  };

  var videoList = {
    controller: function() {
      this.id = 'list of videos...';
    },
    view: function(controller) {
      console.log('controller: ', controller);
      console.log('videolist id: ', this.id);
      return m('div.list', [
        m('div', {
          style: {display: 'block', cursor: 'pointer'},
          onclick: m.route.bind(m.route, '/video/johndoe')
        }, 'johndoe'),
        m('div', {
          style: {display: 'block', cursor: 'pointer'},
          onclick: m.route.bind(m.route, '/video/foo')
        }, 'foo'),
        m('div', {
          style: {display: 'block', cursor: 'pointer'},
          onclick: m.route.bind(m.route, '/video/bar')
        }, 'bar')
      ]);
    }
  };

  //setup routes to start w/ the `#` symbol
  m.route.mode = 'search';

  //define a route
  var appEl = document.getElementById('app');

  m.route(appEl, '/videos/', {
      '/videos': videoList,
      '/video/:videoID...': video
  });

  return;
  */

  var app = {};

  app.velocity = Velocity;

  // Model

  app.guid = (function() {
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

  app.Video = function(data) {
    this.thumbnail  = m.prop(data.src);
    this.title      = m.prop(data.title);
    this.id         = m.prop(app.guid());
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

    videoPlayer.controller = function() {
      this.id = m.route.param('videoID');

      var video = app.vm.getVideoById(this.id);
      this.video = video;

    };

    videoPlayer.vm = {};

    videoPlayer.vm.init = function() {
      this.video = m.prop();
    };

    videoPlayer.width = 108;

    videoPlayer.fadeIn = function(element, isInitialized) {
      if (!isInitialized) {
        var videoEl = element.getElementsByTagName('video')[0];

        videoEl.style.width = videoPlayer.width + 'px';

        app.velocity(videoEl, {width: '100%'}, {
          complete: function() {
            videoEl.focus();
          }
        });
      }
    };

    videoPlayer.autoplay = false;

    videoPlayer.view = function(controller) {
      var vm = app.vm;

      var video = controller.video;

      return video ? [
        m('div.videoPlayer', {
          config: function() {
            videoPlayer.fadeIn.apply(this, arguments);
          },
          style: {
            display: 'inline-block',
            maxWidth: '640px',
            width: '100%'
          }
        }, [
          m('video', {
            autoplay: videoPlayer.autoplay,
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
          m('section.card', { style: {
              width: '100%',
              maxWidth: 'none',
              margin: '1em 0 2em 0'
            }}, [
            m('h1', { style: {
              fontSize: '36px'
            }}, app.strip(video.title())),
            m('div.content', { style: {
              textAlign: 'left',
              margin: '1em'
            }}, app.strip(video.content()))
          ])
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
      this.data = app.vm.videos;
    };

    videoList.init = function() {
      return;

      // m.sto
      m.startComputation();
      videoList.next.fetch().then(function() {
        m.endComputation();
      });
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

    videoList.next.url = m.prop('http://fidm.edu/wps/wcm/connect/wmo%20content/en/about/fidm%20video%20gallery/debut?cmpntid=550064f6-50bb-446e-bd88-52f7d18a7c40&source=library&srv=cmpnt&WCM_Page.ResetAll=TRUE&CACHE=NONE&CONTENTCACHE=NONE&CONNECTORCACHE=NONE');

    videoList.next.getParams = function(url) {
      var vars = {};

      url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value){
          vars[key] = value;
      });
      return vars;
    };

    videoList.next.jsonp = function(config) {
      config = config || {};

      var url = config.url;

      var callbackKey = config.callbackKey || this.getParams(url).jsoncallback || 'callback';

      var promise = new Promise(function(resolve, reject) {
        if (!url) {
          reject('no url');
        }
        else if (typeof WINDOW[callbackKey] !== 'undefined') {
          reject(Error('callback key ' + callbackKey + ' already exists'));
        }
        else {
          var request = m.request({
            background: true,
            dataType: 'jsonp',
            method: config.method || 'GET',
            url: url
          });

          WINDOW[callbackKey] = function(result) {
            resolve({result: result, request: request});
          };
        }
      });

      promise.then(function() {
        delete WINDOW[callbackKey];
      });

      return promise;
    };

    videoList.next.get = function(url) {
      return this.jsonp({ callbackKey: 'processJSON', url: url });
    };

    videoList.next.getElementByTitle = function(element, title) {
      var attributeValue = new RegExp('(^|\\s)' + title + '(\\s|$)', 'i');

      if (attributeValue) {
        var anchorElements = element.getElementsByTagName('a');

        for(var i=0; i < anchorElements.length; i++) {
          var el = anchorElements[i];

          var attribute = el.getAttribute && el.getAttribute('title');

          var isString = ((typeof attribute).toLowerCase() === 'string') && (attribute.length > 0);

          var match = isString && attributeValue.test(attribute);

          if (match) {
            return el;
          }
        }
      }

      return null;
    };

    videoList.currentPage = m.prop(1);

    videoList.next.fetch = function() {
      var vm = app.vm;
      var self = this;

      if (!videoList._loading) {
        videoList._loading = true;

        // var url = vm.url();
        var url = this.url();

        var promise = this.get(url);

        // m.startComputation();

        promise.then(function(promisedData) {
          videoList._loading = false;

          var result = promisedData.result;

          var videos = result.videos.map(function(item) {
            return new app.Video(item);
          });

          vm.videos(app.array_flatten([vm.videos(), videos]));

          var page = parseInt(result.currentPage, BASE_INT);

          // vm.currentPage(page);
          videoList.currentPage(page);

          var element = document.createElement('div');

          element.innerHTML = result.allPages;

          var nextPage = vm.currentPage() + 1;

          var title = app.sub('Link to page {page}', {
            page: nextPage
          });

          var linkPage = videoList.next.getElementByTitle(element, title);

          var url;

          if (linkPage) {
            // I don't know how to make the navigation element in WCM reference the fidm domain. So I have no choice but to do it here.

            url = '//fidm.edu' + linkPage.getAttribute('href');
          }
          else {
            url = null;
          }

          // vm.url(url);
          self.url(url);

          vm.currentPage(nextPage);

          // m.endComputation();
        }, function(brokenPromise) {
          app.error = new Error(brokenPromise);

          videoList._loading = false;
        });

        return promise;
      }
    };

    videoList.next.view = function() {
      return m('section.next', {
        onclick: function() {
          videoList.next.fetch();
        },
        tabindex: 0,
        style: {
          cursor: 'pointer',
          display: 'block',
          width: 'auto'
        }
      }, [
        m('span', 'load more')
      ]);
    };

    videoList.view = function(ctrl) {
      var data = ctrl.data();

      return [
        data ? m('div.videoList', {
            style: {
              textAlign: 'center'
            }
          }, [
          data.map(function(video, index) {
            // var selectedVideo = app.vm.selectedVideo();
            var selectedVideo = false;

            if (false && selectedVideo && (video.title() === selectedVideo.title())) {
              return m('section.card', {
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
                app.vm.videoPlayer.view()
              ]);
            }

            // video.id3

            return m('section.card', {
                style: {
                  cursor: 'pointer'
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
                onclick: m.route.bind(m.route, '/video/' + video.id())
              }, [
              m('h4',
                {
                  style: {
                    marginTop: '0px',
                    overflow: 'hidden',
                    textAlign: 'left',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }
                },
                app.strip(video.title())
              ),
              m('div', {style: {
                position: 'relative'
              }}, [
                m('img.thumbnail', {
                  style: {
                    // height: 'auto',
                    // width: 'auto',
                    height: '70px',
                    width: '118px',
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
                  left: '21px'
                }}, video.duration())
              ])
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

  app.vm.currentPage = m.prop(1);
  app.vm.videos = m.prop([]);


  app.vm.getVideoById = function(id) {
    var videos = app.vm.videos();

    for (var index = 0; index < videos.length; index++) {
      var item = videos[index];

      if (item.id() === id) {
        return item;
      }
    }

    return null;
  };

  app.vm.init = function() {
    this.currentPage = m.prop(1);
    this.videos = m.prop([]);

    // this.videoPlayer = new app.videoPlayer();
    // this.url = m.prop('http://fidm.edu/wps/wcm/connect/wmo%20content/en/about/fidm%20video%20gallery/debut?cmpntid=550064f6-50bb-446e-bd88-52f7d18a7c40&source=library&srv=cmpnt&WCM_Page.ResetAll=TRUE&CACHE=NONE&CONTENTCACHE=NONE&CONNECTORCACHE=NONE');
    // this.videoList = new app.videoList();
    // this.selectedVideo = m.prop();
    // this.filterQuery = m.prop('');

    //define a route

    // m.route(appEl, '/videoList', {
    //   '/videoList': this.videoList,
    //   '/videoPlayer/:videoID...': this.videoPlayer
    // });
  };

  // var appEl = document.getElementById('app');
  //setup routes to start w/ the `#` symbol
  m.route.mode = 'search';

  //a sample module
  // var videos = {
  //   controller: function() {
  //     this.id = m.route.param('videoID');
  //   },
  //   view: function(controller) {
  //     return m('div', controller.id);
  //   }
  // };

  //setup routes to start w/ the `#` symbol
  m.route.mode = 'search';

  //define a route
  // var videos = {
  //   controller: function() {
  //   },
  //   view: function() {
  //     return m('a[href="/video/blahblah"]', {config: m.route}, 'go to page 2');
  //   }
  // };

  // var video = {
  //   controller: function() {
  //     this.id = m.route.param('videoID');
  //     console.log('this.id: ', this.id);
  //   },
  //   view: function(controller) {
  //     console.log('controller: ', controller);

  //     return m('div', [
  //       m('div', controller.id),
  //       m('a[href="/videos"]', {config: m.route}, 'go to page 1'),
  //       videos.view()
  //     ]);
  //   }
  // };

  // var videoList = new app.videoList();

  // m.route(appEl, '/videos', {
  //   '/videos': videoList,
  //   '/video/:videoID...': video
  // });

  // View
  app.view = function() {
    var vm = app.vm;

    return m('div',
      m('h1', app.title),
      vm.videoList.view()
    );
  };

  app.controller= function() {
    this.data = app.vm.videos;
  };

  // Init
  // app.vm.init();

  // Runtime Developing
  window.app = app;

  // Draw
  m.module(document.getElementById('videoList'), new app.videoList());

  var videoPlayerEl = document.getElementById('videoPlayer');

  // infinite loop
  m.route(
    videoPlayerEl,
    '/videos/', {
      '/videos': new app.videoList(),
      '/video/:videoID': new app.videoPlayer()
    }
  );

  // FastClick
  WINDOW.addEventListener('load', function() {
      /* global FastClick */
      /* jshint strict:false */
      FastClick.attach(document.body);
  }, false);

  // m.module(document.body, app);

  // m.route.param('videoID', '7f4adfbe-6329-417b-952b-e2fcc68339cf')
})(window, document);