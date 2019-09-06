let cp = require('./copy')
let rmrf = require('rimraf')
let fs = require('fs')
let path = require('path')
let series = require('run-series')
let getBasePaths = require('./get-base-paths')
let printer = require('../_printer')
let {updater} = require('@architect/utils')

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
  let {quiet} = params
  let shared = path.join(process.cwd(), 'src', 'shared')
  let hasShared = fs.existsSync(shared)
  let start
  let update // Always set quiet: true in updater, as updater will double-log to console

  if (hasShared) {
    // Kick off logging
    start = printer.start({
      cwd: '',
      action: `Hydrating app with src${path.sep}shared`,
      quiet: true
    })
    if (!quiet) {
      update = updater('Hydrate')
      update.start(`Hydrating app with src${path.sep}shared`)
    }

    function done (err) {
      if (err) {
        if (update && !quiet)
          update.err(err)
        let params = {
          cmd: 'copy',
          err,
          start,
          quiet: true
        }
        printer.done(params, callback)
      }
      else {
        if (update && !quiet)
          update.done(`Hydrated app with src${path.sep}shared`)
        let params = {
          cmd: 'copy',
          stdout: `Hydrated app with src${path.sep}shared`,
          start,
          quiet: true
        }
        printer.done(params, callback)
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
