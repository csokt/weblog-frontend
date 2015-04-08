var gobble = require( 'gobble' );

module.exports = gobble([

  gobble( 'src/styles' ).transform( 'concat', { dest: 'bundle.css' }),
  gobble( 'src/root' ),
  gobble( 'src/images' ).moveTo( 'images' ),
  gobble( 'src/swf' ).moveTo( 'swf' ),
  gobble( ['src/scripts', 'src/templates'] )
    .transform( 'ractive', { type: 'cjs' } )
    .transform( 'browserify', {
      entries: './app.js',
      dest: 'bundle.js',
      debug: true
    })
    .transform( 'uglifyjs' )

])
