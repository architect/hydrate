let cp = require('./copy')
let fs = require('fs')
let path = require('path')
let series = require('run-series')
let getBasePaths = require('./get-base-paths')

/**
 * copies public/static.json
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs10.x | node_modules/@architect/shared/static.json
 * ruby2.5    | vendor/shared/static.json
 * python3.7  | vendor/shared/static.json
 *
 */
module.exports = function copyArc(callback) {
  getBasePaths('static', function gotBasePaths(err, paths) {
    if (err) throw err
    let static = path.join(process.cwd(), 'public', 'static.json')
    let hasStatic = fs.existsSync(static)
    series(paths.map(dest=> {
      return function copier(callback) {
        if (hasStatic) {
          cp(static, path.join(dest, 'shared', 'static.json'), callback)
        }
        else {
          callback()
        }
      }
    }),
    function done(err) {
      if (err) callback(err)
      else callback()
    })
  })
}
