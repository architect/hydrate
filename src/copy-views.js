let cp = require('./copy')
let fs = require('fs')
let path = require('path')
let series = require('run-series')
let getBasePaths = require('./get-base-paths')

/**
 * copies src/views
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs10.x | node_modules/@architect/views/
 * ruby2.5    | vendor/bundle/architect-functions/views/
 * python3.7  | vendor/architect-functions/views/
 *
 */
module.exports = function copyArc(callback) {
  getBasePaths('views', function gotBasePaths(err, paths) {
    if (err) throw err
    series(paths.map(dest=> {
      return function copier(callback) {
        let src = path.join(process.cwd(), 'src', 'views')
        if (fs.existsSync(src) && dest.includes('get-')) {
          cp(src, path.join(dest, 'views'), callback)
        }
        else {
          callback()
        }
      }
    }),
    function done(err) {
      if (err) throw err
      callback()
    })
  })
}
