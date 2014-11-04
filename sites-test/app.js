/* global m */
/* global console */

(function(global) {
  'use strict';

  var app = {};

  app.title = 'Sites';

  // Model
  app.Site = function(data) {
    this.siteName  = m.prop(data.siteName);
    this.domainName  = m.prop(data.domainName);
    this.description  = m.prop(data.description);
  };

  // subview
  app.sites = function() {
    var sites = {};

    sites.vm = {
      init: function() {}
    };

    sites.view = function(ctrl) {
      var data = ctrl.data();

      return [
        data ? m('ul', [
          data.map(function(site, index) {
            return m('li', {style: {display: 'block'}}, [
              m('div.siteName', site.siteName()),
              m('div.domainName', site.domainName()),
              m('div.description', site.description()),
              m('hr')
            ]);
          })
        ]) : ''
      ];
    };

    return sites;
  };

  // View Model
  app.vm = {};

  // a derivative of thwang1206's method: http://git.io/pUyaYQ
  app.vm.getParams =function(url){
    var vars = {},
      parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
        vars[key] = value;
    });
    return vars;
  }

  app.vm.jsonp = function(config) {
    config = config || {};

    var url = config.url || '';
    var callbackKey = config.callbackKey || app.vm.getParams(url).jsoncallback || 'callback';

    var promise = new Promise(function(resolve, reject) {
      if (typeof global[callbackKey] !== 'undefined') {
        reject(Error('callback key ' + callbackKey + ' already exists'));
      }
      else {
        global[callbackKey] = resolve.bind();

        m.request({
          dataType: 'jsonp',
          method: config.method || 'GET',
          url: url
        });
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

  app.vm.init = function() {
    this.get('../p-data.json?jsoncallback=my_callback').then(function(promisedData) {
      app.vm.data = m.prop(promisedData.sites.map(function(item) {
        return new app.Site(item);
      }));

      m.redraw(true); // force
    });

    this.sites = new app.sites();
    this.sitesData = m.prop([]);
  };

  global.app = app;

  // skinny Controller
  app.controller = function() {};

  // View
  app.view = function() {
    var vm = app.vm;

    return m('div', [
      m('h1', app.title),
      vm.sites.view({data: vm.data})
    ]);
  };

  // Init
  app.vm.init();

  // Draw
  m.module(document.getElementById('app'), {controller: app.controller, view: app.view});
})(window);