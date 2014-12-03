/* global m */
/* global Velocity, FastClick */
/* jshint devel:true, strict:false */

// todo: move import structural css from stylesheet

(function(window, document) {
  var app = {};

  // App dependancies
  app.velocity = Velocity;
  app.fastclick = FastClick;

  // Stip utility
  app.strip = function(html) {
    // http://stackoverflow.com/a/822486
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Sub utility
  app.sub = function(str, obj) {
    var keys = Object.keys(obj);

    keys.map(function(key) {
      var re = new RegExp('{' + key + '}', 'gm');
      str = str.replace(re, obj[key]);
    });

    return str;
  };

  // Array Flatten utility
  app.array_flatten = function(arrays) {
    return [].concat.apply([], arrays);
  };

  // GUID utility
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

  // Model
  app.Video = function(data) {
    this.content    = m.prop(data.content);
    this.duration   = m.prop(data.duration);
    this.flash      = m.prop(data.flash);
    this.href       = m.prop('');
    this.id         = m.prop(app.guid());
    this.mp4        = m.prop(data.mp4);
    this.ogg        = m.prop(data.ogg);
    this.poster     = m.prop(data.poster);
    this.thumbnail  = m.prop(data.src);
    this.title      = m.prop(data.title);
    this.webm       = m.prop(data.webm);

    // temp
    this.date       = m.prop('September 21, 2014');
  };

  // Module: Video Player
  app.videoPlayer = function() {
    var videoPlayer = {};

    videoPlayer.vm  = {};

    videoPlayer.controller = function() {
      this.data  = app.vm.getVideos;
      this.video = app.vm.getVideoById(m.route.param('videoID'));
    };

    videoPlayer.vm.init = function() {
      this.autoplay = m.prop(false);
      this.video    = m.prop();
      this.width    = 108;
    };

    videoPlayer.vm.fadeIn = function(element, isInitialized) {
      if (!isInitialized) {
        var videoEl = element.getElementsByTagName('video')[0];

        videoEl.style.width = videoPlayer.vm.width + 'px';
        app.velocity(videoEl, {width: '100%'}, {
          complete: function() {
            videoEl.focus();
          }
        });
      }
    };

    videoPlayer.view = function(controller) {
      var returnVal;
      var video = controller.video;

      if (video) {
        var htmlTitle   = video.title();
        var htmlContent = video.content();
        var vm          = videoPlayer.vm;

        returnVal       = [
          m('div.header', { style: {
            position: 'fixed',
            top: 0,
            right: 0,
            left: 0,
            zIndex: 1999999999
          }}, [
            m('div.header-container', { style: {
              background: '#fff',
              borderBottom: '1px solid #e8e8e8',
              minWidth: 0,
              paddingBottom: '8px',
              paddingTop: '7px'
            }}, [
              m('div.row', [
                m('div.col-md-3', [
                  m('div.title', {
                    style : {
                      cursor: 'pointer',
                      height: '34px',
                      fontSize: '24px',
                      lineHeight: '34px',
                      whiteSpace: 'nowrap'
                    },
                    onclick : m.route.bind(m.route, '/videos')
                  }, app.vm.title)
                ]),
                m('div.col-md-4.pull-right', [
                  m('div.input-group', [
                    m('input.form-control', {placeholder: 'This is just a proof of concept.'}),
                    m('span.input-group-btn', [
                      m('button.btn.btn-default', [
                        m('i.fa.fa-search')
                      ])
                    ])
                  ])
                ])
              ])
            ])
          ]),
          m('div.videoPlayer', {
            config: function() {
              vm.fadeIn.apply(this, arguments);
            },
            style: {
              display    : 'inline-block',
              maxWidth   : '640px',
              paddingTop : '2em',
              width      : '100%'
            }
          }, [
            m('video', {
              autoplay : vm.autoplay(),
              controls : true,
              style    : {
                maxWidth : '640px',
                width    : '100%'
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
                margin   : '1em 0 2em 0',
                maxWidth : 'none',
                textAlign : 'left',
                width    : '100%'
              }}, [
              m('h1', { style: {
                fontSize: '36px'
              }}, app.strip(htmlTitle)),
              m('strong', { style: {
                margin: '1em'
              }}, video.date()),
              m('div.content', { style: {
                margin    : '1em'
              }}, app.strip(htmlContent))
            ])
          ]),
          app.vm.videoList.view(controller)
        ];
      }
      else {
        returnVal = m('');
      }

      return returnVal;
    };

    videoPlayer.vm.init();

    return videoPlayer;
  };

  // Module: Video List
  app.videoList = function() {
    var videoList = {};

    videoList.vm  = {};

    videoList.vm.init = function() {
      this.videos       = m.prop([]);
      this.currentPage  = m.prop(1);
      this.loading      = m.prop(false);
      this.url = m.prop('http://fidm.edu/wps/wcm/connect/wmo%20content/en/about/fidm%20video%20gallery/debut?cmpntid=550064f6-50bb-446e-bd88-52f7d18a7c40&source=library&srv=cmpnt&WCM_Page.ResetAll=TRUE&CACHE=NONE&CONTENTCACHE=NONE&CONNECTORCACHE=NONE');

      videoList.next.fetch();
    };

    videoList.vm.keyDown = function(event) {
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

    // videoList.next.url = m.prop('http://fidm.edu/wps/wcm/connect/wmo%20content/en/about/fidm%20video%20gallery/debut?cmpntid=550064f6-50bb-446e-bd88-52f7d18a7c40&source=library&srv=cmpnt&WCM_Page.ResetAll=TRUE&CACHE=NONE&CONTENTCACHE=NONE&CONNECTORCACHE=NONE');

    videoList.next.getParams = function(url) {
      var vars = {};

      url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value){
          vars[key] = value;
      });

      return vars;
    };

    videoList.next.jsonp = function(config) {
      config          = config || {};
      var url         = config.url;
      var callbackKey = config.callbackKey || this.getParams(url).jsoncallback || 'callback';
      var promise     = new Promise(function(resolve, reject) {
        if (!url) {
          reject('no url');
        }
        else if (typeof window[callbackKey] !== 'undefined') {
          reject(Error('callback key ' + callbackKey + ' already exists'));
        }
        else {
          var request = m.request({
            background : true,
            dataType   : 'jsonp',
            method     : config.method || 'GET',
            url        : url
          });

          window[callbackKey] = function(result) {
            resolve({result: result, request: request});
          };
        }
      });

      promise.then(function() {
        delete window[callbackKey];
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
          var el        = anchorElements[i];
          var attribute = el.getAttribute && el.getAttribute('title');
          var isString  = ((typeof attribute).toLowerCase() === 'string') && (attribute.length > 0);
          var match     = isString && attributeValue.test(attribute);

          if (match) {
            return el;
          }
        }
      }

      return null;
    };

    videoList.next.videoFactory = function(videos) {
      return videos.map(function(item) {
        return new app.Video(item);
      });
    };

    videoList.next.fetch = function() {
      var url     = videoList.vm.url();
      var promise = videoList.next.get(url);

      videoList.vm.loading(true);
      m.startComputation();

      promise.then(function(promisedData) {
        var result         = promisedData.result;
        var videos         = videoList.next.videoFactory(result.videos);
        var vm             = videoList.vm;
        var videosMerged   = app.array_flatten([vm.videos(), videos]);
        var element        = document.createElement('div');
        // var page           = parseInt(result.currentPage, BASE_INT);

        vm.loading(false);

        vm.videos(videosMerged);

        element.innerHTML = result.allPages;

        var nextPage = vm.currentPage() + 1;
        var title    = app.sub('Link to page {page}', { page: nextPage });
        var linkPage = videoList.next.getElementByTitle(element, title);
        var url      = linkPage ? '//fidm.edu' + linkPage.getAttribute('href') : null;
        // I don't know how to make the navigation element in WCM reference the fidm domain. So I have no choice but to do it here.

        videoList.vm.url(url);

        vm.currentPage(nextPage);

        m.endComputation();
      }, function(brokenPromise) {
        videoList.vm.loading(false);

        app.error = new Error(brokenPromise);

        m.endComputation();
      });

      return promise;
    };

    videoList.next.view = function() {
      var vm = videoList.vm;

      return m('section.next', {
        onclick: function() {
          if (!vm.loading()) {
            videoList.next.fetch();
          }
        },
        tabindex: 0,
        style: {
          cursor  : 'pointer',
          display : 'block',
          width   : 'auto'
        }}, [
        m('button', { style: {
          background: '#f8f8f8',
          border: 'solid 1px #d3d3d3',
          color: '#666',
          fontHeight: 'normal',
          fontSize: '13px',
          lineHeight: '30px',
          marginBottom: '1em',
          minHeight: '30px',
          outline: '0',
          padding: '0 10px',
          textAlign: 'center'
        }}, 'Show more items')
      ]);
    };

    videoList.controller = function() {
      this.data = videoList.vm.videos;
    };

    videoList.view = function(controller) {
      var vm   = videoList.vm;
      var data = controller.data();

      return [
        data && data.length ? m('div.videoList', {
            style: { textAlign: 'center' }
          }, [
          data.map(function(video, index) {
            var tabindex     = (index === 0) ? 0 : -1;
            var routeToVideo = m.route.bind(m.route, '/video/' + video.id());

            return m('section.card', {
              style: { cursor: 'pointer' },
              tabindex: tabindex,
              onkeydown: vm.keyDown,
              onkeypress: function(event) {
                var keyCode = event.keyCode;

                if (keyCode === 13) {
                  // enter
                  event.preventDefault();
                  event.stopPropagation();

                  routeToVideo();
                }
              },
              onclick: routeToVideo
            }, [
              m('h4',
                {
                  style: {
                    marginTop    : '0px',
                    overflow     : 'hidden',
                    textAlign    : 'left',
                    textOverflow : 'ellipsis',
                    whiteSpace   : 'nowrap'
                  }
                },
                app.strip(video.title())
              ),
              m('div', {style: {
                position: 'relative'
              }}, [
                m('img.thumbnail', {
                  style: {
                    height       : '70px',
                    marginBottom : 0, // bootstrap :/
                    textAlign    : 'right',
                    width        : '118px'
                  },
                  src   : video.thumbnail(),
                  width : app.videoWidth
                }),
                m('div.duration', { style: {
                  backgroundColor : '#000',
                  bottom          : '6px',
                  color           : '#fff',
                  fontSize        : '11px',
                  fontWeight      : 'bold',
                  left            : '21px',
                  opacity         : 0.75,
                  padding         : '0px 4px',
                  position        : 'absolute'
                }}, video.duration())
              ])
            ]);
          }),
          videoList.next.view()
        ]) : m('div', 'I could not find any videos.')
      ];
    };

    videoList.vm.init();

    return videoList;
  };

  // App View Model
  app.vm = {};

  app.vm.getVideos = function() {
    return app.vm.videoList.vm.videos();
  };

  app.vm.getVideoById = function(id) {
    var videos = app.vm.getVideos();

    for (var index = 0; index < videos.length; index++) {
      var item = videos[index];

      if (item.id() === id) {
        return item;
      }
    }

    return null;
  };

  // Runtime Developing
  window.app = app;

  // Init app
  app.vm.videoList   = new app.videoList();
  app.vm.videoPlayer = new app.videoPlayer();
  app.vm.title       = 'FIDM Videos';

  // App routing
  m.route.mode = 'search';
  m.route(
    document.getElementById('videoPlayer'),
    '/videos/', {
      '/videos': app.vm.videoList,
      '/video/:videoID': app.vm.videoPlayer
    }
  );

  // Attach FastClick
  window.addEventListener('load', function() {
      app.fastclick.attach(document.body);
  }, false);

})(window, document);