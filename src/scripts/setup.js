/* global controldefaults:true */
/* global dtdefaults:true */
/* global wlang:true */
/* global dtlang:true */

uidefaults = {
  controls: uicontrols,
  reset: true,
  topic: true,
  file: true,
  range: true,
  filter: true,
  offset: true,
  count: true,
  reload: true,
  receive: true,
}

controldefaults = {
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

dtdefaults = {
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
  order: [[0, 'asc']],
//    renderer: 'bootstrap',
  stateSave: false,
  displayStart: 0,
//  autoWidth: false,
}

wlang = {
  en: {
    begin: 'Begin',
    end: 'End',
    filter: 'Filter',
    offset: 'Offset',
    count: 'Count',
    reload: 'Reload',
    receive: 'Receive',
    search: 'search',
  },

  hu: {
    begin: 'Kezd',
    end: 'Vég',
    filter: 'Szűrő',
    offset: 'Indul',
    count: 'Sorok',
    reload: 'Beolvas',
    receive: 'Adatgyűjtés',
    search: 'keresés',
  }
}

dtlang = {
  en : {
    'sEmptyTable':     'No data available in table',
    'sInfo':           'Showing _START_ to _END_ of _TOTAL_ entries',
    'sInfoEmpty':      'Showing 0 to 0 of 0 entries',
    'sInfoFiltered':   '(filtered from _MAX_ total entries)',
    'sInfoPostFix':    '',
    'sInfoThousands':  ',',
    'sLengthMenu':     'Show _MENU_ entries',
    'sLoadingRecords': 'Loading...',
    'sProcessing':     'Processing...',
    'sSearch':         'Search:',
    'sZeroRecords':    'No matching records found',
    'oPaginate': {
      'sFirst':    'First',
      'sLast':     'Last',
      'sNext':     'Next',
      'sPrevious': 'Previous'
    },
    'oAria': {
      'sSortAscending':  ': activate to sort column ascending',
      'sSortDescending': ': activate to sort column descending'
    }
  },

  hu: {
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
