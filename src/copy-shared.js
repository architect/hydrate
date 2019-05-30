let cp = require('./copy')
let fs = require('fs')
let path = require('path')
let series = require('run-series')
let getBasePaths = require('./get-base-paths')

/**
 * copies src/shared
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs10.x | node_modules/@architect/shared/
 * ruby2.5    | vendor/bundle/architect-functions/shared/
 * python3.7  | vendor/architect-functions/shared/
 *
 */
module.exports = function copyArc(callback) {
  getBasePaths('shared', function gotBasePaths(err, paths) {
    if (err) throw err
    series(paths.map(dest=> {
      return function copier(callback) {
        let src = path.join(process.cwd(), 'src', 'shared')
        if (fs.existsSync(src)) {
          cp(src, path.join(dest, 'shared'), callback)
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
