/* global console */
/* global jQuery:true */
/* global require */
/* global autobahn:true */
/* global AUTOBAHN_DEBUG:true */
/* global language */
/* global realm */
/* global uidefaults */
/* global controldefaults */
/* global dtdefaults */
/* global wlang */
/* global dtlang */

// ######################################################################################################  Variables  ####

AUTOBAHN_DEBUG = false
var DEBUG = false
require('ractive').DEBUG = false

require('./setup')
dtdefaults.language = dtlang[language]

var _ = require('lodash')
jQuery = require('jquery')
require('datatables')
require('drmonty-datatables-tabletools')
require('drmonty-datatables-plugins/integration/jqueryui/dataTables.jqueryui')
var autobahn = require('autobahn')
var wsuri         // the URL of the WAMP Router (Crossbar.io)
var datatable     // jQuery DataTable object
var connection    // WAMP connection object to the Router
var wampsession   // WAMP session variable
var sub           // Current subscription
var setups = {}   // Discovered services

var model = {
  ui: _.clone(uidefaults),
  controls: _.clone(controldefaults),
  password: '',
  isopen: false,
  servers: [],
  headers: [],
  lang: wlang[language]
}

var Template = require('./template')

var ractive = new Template({
  el: 'container',
  magic: true,
  data: model,
  computed: {
    filteredservers: function () {
      var filtered = this.get('servers')
      var domain   = this.get('controls.domain')
      var host     = this.get('controls.host')
      var service  = this.get('controls.service')
      if (domain)  { filtered = _.where(filtered, {domain:   domain }) }
      if (host)    { filtered = _.where(filtered, {host:     host   }) }
      if (service) { filtered = _.where(filtered, {service:  service}) }
      return filtered
    },
    domains:  function () { return _.unique(_.pluck(this.get('filteredservers'), 'domain')).sort() },
    hosts:    function () { return _.unique(_.pluck(this.get('filteredservers'), 'host')).sort() },
    services: function () { return _.unique(_.pluck(this.get('filteredservers'), 'service')).sort() },
    files:    function () { return _.pluck(this.get('headers'), 'file') },
    domain:   function () { var fields = this.get('domains');  return fields.length === 1 ? fields[0] : '' },
    host:     function () { var fields = this.get('hosts');    return fields.length === 1 ? fields[0] : '' },
    service:  function () { var fields = this.get('services'); return fields.length === 1 ? fields[0] : '' },
    topic:    function () {
      if (this.get('domain') && this.get('host') && this.get('service')) {
        return this.get('domain')+'.'+this.get('host')+'.'+this.get('service')
      } else {
        return ''
      }
    },
    fieldsearch: function () { return this.get('controls.header.view') || this.get('controls.header.select') ? true : false },
  }
})

ractive.observe( 'domain host service', function ( newValue, oldValue, keypath ) {
  if (newValue) {
    setTimeout(function () {
      ractive.set('controls.'+keypath, newValue)
    }, 10)
  }
})

ractive.observe( 'topic', function ( topic ) {
  if (topic) {
    subscribe()
  } else {
    if (sub && sub.active) { wampsession.unsubscribe(sub) }
    if (datatable) { datatable.destroy(true) }
    sub = undefined
  }
})

ractive.observe( 'controls.fileind', function ( fileind ) {
//  model.controls.receive = fileind ? false : true
  if (fileind > 0 && model.controls.offset < 0) {
    model.controls.offset = 0
  }
  if (fileind > -1) {
    model.controls.header = model.headers[fileind]
    reload()
  }
})

ractive.observe( 'controls.header', function () {
  if (ractive.get('fieldsearch')) {
    model.controls.rangefield = model.controls.filterfield = 0
    model.controls.offset = 0
  }
  if (datatable) { datatable.destroy(true) }
  if (model.controls.header.header) {
    var columns = _.map(model.controls.header.header, function(title) { return {title: title} })
    createtable(columns)
  }
})

ractive.observe( 'controls.offset', function () {
  if (model.controls.offset < 0) {
    model.controls.count = -model.controls.offset
  }
})

// ######################################################################################################  WAMP connection  ####

ractive.observe( 'password', function () {

  if (document.location.origin == 'file://') {
     wsuri = 'ws://127.0.0.1:8080/ws'
  } else {
     wsuri = (document.location.protocol === 'http:' ? 'ws:' : 'wss:') + '//' + document.location.hostname + ':8080/ws'
  }

  connection = new autobahn.Connection({
     url: wsuri,
     realm: realm + model.password
  })

  connection.onopen = function (session) {
    model.isopen = true
    wampsession = session
    session.subscribe('announce', function(args) {
      setups[args[0].topic] = args[0]
      if (DEBUG) { console.log(args[0]) }
    })
    discover()
  }

  connection.onclose = function (reason) {
    model.isopen = false
    console.log('Connection lost:', reason)
  }

  connection.open()

})
// ######################################################################################################  WAMP comm  ####

var discover = function() {
  setups = {}
  model.servers = []
  model.headers = []
  model.ui = _.clone(uidefaults)
  model.controls = _.clone(controldefaults)

  if (DEBUG) { console.log('discover started') }
  wampsession.publish('discover', [])
  setTimeout(function () {
    if (DEBUG) { console.log('discover ended') }
    model.servers = _.values(setups)
  }, 500)
}

var on_logrow = function(args) {
  if (!model.controls.receive) { return }
  datatable.row.add(args).draw()
}

var subscribe = function() {
  wampsession.subscribe(ractive.get('topic'), on_logrow).then(
    function (subscription) {
      sub = subscription
      console.log('Subscribed to', sub.topic)
      wampsession.call(sub.topic+'.header', []).then(
        function (headers) {
          if (DEBUG) { console.log('headers', headers) }
          model.headers = headers
          model.controls.fileind = 0
        },
        function (err) {
          console.log('Header error:', err)
          sub = undefined
        }
      )
    }
  )
}

var reload = function() {
  if (!sub) { return }
  model.controls.receive = false
  wampsession.call(sub.topic+'.reload', [model.controls]).then(
    function (rows) {
      console.log('reload called')
      if (DEBUG) { console.log('rows', rows) }
      datatable.clear().rows.add(rows).draw()
    },
    function (err) {
      console.log('Reload error:', err)
    }
  )
}

// ######################################################################################################  Helpers  ####

var createtable = function(columns) {
  var options = { columns: columns }
  _.defaults(options, dtdefaults)
  var html = '<table cellpadding="0" cellspacing="0" border="0" class="display compact" id="datatable">'
  html += '<tfoot> <tr>'
  _.each(model.controls.header.header, function(field) {
    html += '<th> <input type="text" placeholder="'+field+' '+model.lang.search+'" /> </th>'
  })
  html += '</tr> </tfoot>'
  html += '</table>'
  jQuery('#datatable_wrapper').html(html)
  datatable = jQuery('#datatable').DataTable(options)
  datatable.columns().eq( 0 ).each( function ( colIdx ) {
    jQuery( 'input', datatable.column( colIdx ).footer() ).on( 'keyup change', function () {
      datatable.column( colIdx ).search( this.value ).draw()
    })
  })
}

// ######################################################################################################  Setup  ####

ractive.on('discover', discover)
ractive.on('reload', reload)
