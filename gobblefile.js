var gobble = require( 'gobble' );

module.exports = gobble([

	// the main index.html file, and the turkey logo
  gobble( 'src/styles' ).transform( 'concat', { dest: 'bundle.css' }),
  gobble( 'src/root' ),
  gobble( 'src/images' ).moveTo( 'images' ),
  gobble( ['src/scripts', 'src/templates'] )
//  gobble( 'src/javascript' )
    .transform( 'ractive', { type: 'cjs' } )
//    .transform( 'derequire' )
    .transform( 'browserify', {
      entries: './app.js',
      dest: 'bundle.js',
      debug: true
    })
//    .transform( 'uglifyjs' )


//  gobble( 'src/js' ).transform( 'browserify', {
//  gobble( 'src/coffee' ).transform( 'coffee' ).transform( 'browserify', {
//    entries: './app.js',
//    dest: 'bundle.js'
//  }),

])
