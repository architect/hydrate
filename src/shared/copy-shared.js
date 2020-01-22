let cp = require('./copy')
let rmrf = require('rimraf')
let fs = require('fs')
let path = require('path')
let series = require('run-series')
let getBasePaths = require('./get-base-paths')
let print = require('../_printer')

/**
 * copies src/shared
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs12.x | node_modules/@architect/shared/
 * nodejs10.x | node_modules/@architect/shared/
 * python3.7  | vendor/shared/
 * python3.6  | vendor/shared/
 * ruby2.5    | vendor/shared/
 *
 */
module.exports = function copyShared(params, callback) {
  let {update, only} = params
  let shared = path.join(process.cwd(), 'src', 'shared')
  let hasShared = fs.existsSync(shared)
  let go = !only || only === 'shared'

  if (hasShared && go) {
    // Kick off logging
    let srcShared = `src${path.sep}shared`
    let done = `Hydrated app with ${srcShared}`
    let start = update.start(`Hydrating app with ${srcShared}`)

    function _done (err) {
      let cmd = 'copy'
      if (err) {
        print({cmd, err, start, update}, callback)
      }
      else {
        print({cmd, start, done, update}, callback)
      }
    }
    getBasePaths('shared', function gotBasePaths(err, paths) {
      if (err) _done(err)
      else {
        series(paths.map(dest=> {
          return function copier(callback) {
            let finalDest = path.join(dest, 'shared')
            rmrf(finalDest, {glob:false}, function(err) {
              if (err) callback(err)
              else cp(shared, finalDest, callback)
            })
          }
        }), _done)
      }
    })
  }
  else callback()
}
