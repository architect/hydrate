let cp = require('./copy')
let rmrf = require('rimraf')
let fs = require('fs')
let path = require('path')
let series = require('run-series')
let getBasePaths = require('./get-base-paths')
let printer = require('../_printer')

/**
 * copies src/shared
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs10.x | node_modules/@architect/shared/
 * ruby2.5    | vendor/shared/
 * python3.7  | vendor/shared/
 *
 */
module.exports = function copyShared(params, callback) {
  let {update} = params
  let shared = path.join(process.cwd(), 'src', 'shared')
  let hasShared = fs.existsSync(shared)
  let start

  if (hasShared) {
    // Kick off logging
    start = printer.start({
      cwd: '',
      action: `Hydrating app with src${path.sep}shared`,
      update
    })

    function done (err) {
      if (err) {
        printer.done({
          cmd: 'copy',
          err,
          start,
          update
        }, callback)
      }
      else {
        printer.done({
          cmd: 'copy',
          stdout: `Hydrated app with src${path.sep}shared`,
          start,
          update
        }, callback)
      }
    }
    getBasePaths('shared', function gotBasePaths(err, paths) {
      if (err) done(err)
      else {
        series(paths.map(dest=> {
          return function copier(callback) {
            let finalDest = path.join(dest, 'shared')
            rmrf(finalDest, {glob:false}, function(err) {
              if (err) callback(err)
              else cp(shared, finalDest, callback)
            })
          }
        }), done)
      }
    })
  }
  else callback()
}
