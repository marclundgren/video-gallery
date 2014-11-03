/* global m */
/* global console */

(function() {
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
      console.log('app.vm.sitesData: ', app.vm.sitesData());

      return m('div.temp', 'todo: show sites name, description...');
    };

    return sites;
  };

  // View Model
  app.vm = {};

  window.my_callback = console.log.bind(console);

  app.vm.init = function() {
    this.sitesData = m.request({
      method: 'GET',
      callbackKey: 'my_callback',
      url: '../p-data.json',
      // background: true,
      // type: app.Site,
      dataType: 'jsonp'
    });

    // debugger;

    this.sites = new app.sites();
  };

  window.app = app;

  // skinny Controller
  app.controller = function() {};

  // View
  app.view = function() {
    var vm = app.vm;

    return m('div', [
      m('h1', app.title),
      // vm.sites.view({data: vm.data})
      vm.sites.view()
    ]);
  };

  // Init
  app.vm.init();

  // Draw
  m.module(document.getElementById('app'), {controller: app.controller, view: app.view});
})();