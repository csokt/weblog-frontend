/* global console */
/* global jQuery */
/* global _ */
/* global autobahn */
/* global Ractive */

// ######################################################################################################  Variables  ####

AUTOBAHN_DEBUG = false
var DEBUG = false
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
var controldefaults = {
  domain: '',
  host: '',
  service: '',
  header: {},
  begin: '',
  end: '',
  filter: '',
  rangefield: -1,
  filterfield: -1,
  offset: -100,
  count: 100,
  receive: false,
  fileind: -1,
}

var model = {
  controls: _.clone(controldefaults),
  servers: [],
  headers: []
}
var setups = {}

var Template = require('./template')

//var ractive = new Ractive({
var ractive = new Template({
  el: 'container',
//  template: '#template',
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
    fieldsearch: function () { return this.get('controls.header.view') ? true : false },
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
  model.controls.receive = fileind ? false : true
  if (fileind > 0 && model.controls.offset < 0) {
    model.controls.offset = 0
  }
  if (fileind > -1) {
    model.controls.header = model.headers[fileind]
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

//if (document.location.origin == 'file://') {
//   wsuri = 'ws://127.0.0.1:8080/ws'
//} else {
//   wsuri = (document.location.protocol === 'http:' ? 'ws:' : 'wss:') + '//' + document.location.host + '/ws'
//}
wsuri = 'ws://127.0.0.1:8080/ws'
connection = new autobahn.Connection({
   url: wsuri,
   realm: 'weblog'
})

connection.onopen = function (session) {
  wampsession = session
  session.subscribe('announce', function(args) {
    setups[args[0].topic] = args[0]
    if (DEBUG) { console.log(args[0]) }
  })
  discover()
}

connection.onclose = function (reason) {
  console.log('Connection lost:', reason)
}

// ######################################################################################################  WAMP comm  ####

var discover = function() {
  setups = {}
  model.headers = []
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
  console.log('Reload started')
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
  _.defaults(options, DTdefaultOptions)
  var html = '<table cellpadding="0" cellspacing="0" border="0" class="display compact" id="datatable">'
  html += '<tfoot> <tr>'
  _.each(model.controls.header.header, function(field) {
    html += '<th> <input type="text" placeholder="'+field+' keresés" /> </th>'
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

var DTdefaultOptions = {
//    paging: false,
  dom: 'T<"clear">lfrtip',
  'oTableTools': {
    'sSwfPath': 'swf/copy_csv_xls_pdf.swf',
    'aButtons': [
    {
      'sExtends': 'copy',
      'oSelectorOpts': { filter: 'applied', order: 'current' }
    },
    {
      'sExtends': 'xls',
      'oSelectorOpts': { filter: 'applied', order: 'current' },
    },
    {
      'sExtends': 'pdf',
      'oSelectorOpts': { filter: 'applied', order: 'current' },
      'sPdfOrientation': 'landscape',
    },
    {
      'sExtends': 'print',
      'oSelectorOpts': { filter: 'applied', order: 'current' },
    }
    ]
  },
  autoWidth: false,
  pageLength: 100,
  lengthMenu: [ 10, 50, 100, 500, 1000, 5000 ],
//  scrollX: '70vw',
  scrollY: 600,
//  scrollY: 330,
//  jQueryUI: true,
//    dom: '<'H'lfr>t<'F'ip>',
//    pagingType: 'full_numbers',
//  searchDelay: 400,
//    order: [ 0, 'desc' ],
  order: [[0, 'desc']],
//    renderer: 'bootstrap',
  stateSave: false,
  displayStart: 0,
//  autoWidth: false,
  language: {
    'sEmptyTable':     'Nincs rendelkezésre álló adat',
    'sInfo':           'Találatok: _START_ - _END_ Összesen: _TOTAL_',
    'sInfoEmpty':      'Nulla találat',
    'sInfoFiltered':   '(_MAX_ összes rekord közül szűrve)',
    'sInfoPostFix':    '',
    'sInfoThousands':  ' ',
    'sLengthMenu':     '_MENU_ találat oldalanként',
    'sLoadingRecords': 'Betöltés...',
    'sProcessing':     'Feldolgozás...',
    'sSearch':         'Keresés:',
    'sZeroRecords':    'Nincs a keresésnek megfelelő találat',
    'oPaginate': {
      'sFirst':    'Első',
      'sPrevious': 'Előző',
      'sNext':     'Következő',
      'sLast':     'Utolsó'
    },
    'oAria': {
      'sSortAscending':  ': aktiválja a növekvő rendezéshez',
      'sSortDescending': ': aktiválja a csökkenő rendezéshez'
    }
  }
}

connection.open()
ractive.on('discover', discover)
ractive.on('reload', reload)
