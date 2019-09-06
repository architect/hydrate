let cp = require('./copy')
let rmrf = require('rimraf')
let fs = require('fs')
let path = require('path')
let series = require('run-series')
let getBasePaths = require('./get-base-paths')
let printer = require('../_printer')
let {inventory, updater} = require('@architect/utils')

/**
 * copies src/views
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs10.x | node_modules/@architect/views/
 * ruby2.5    | vendor/views/
 * python3.7  | vendor/views/
 *
 */
module.exports = function copyViews(params, callback) {
  let {quiet} = params
  let views = path.join(process.cwd(), 'src', 'views')
  let hasViews = fs.existsSync(views)
  let inv
  let start
  let update // Always set quiet: true in updater, as updater will double-log to console

  if (hasViews) {
    // Kick off logging
    start = printer.start({
      cwd: '',
      action: `Hydrating app with src${path.sep}views`,
      quiet: true
    })
    if (!quiet) {
      update = updater('Hydrate')
      update.start(`Hydrating app with src${path.sep}views`)
    }
    if (!inv)
      inv = inventory()

    function isView (dest) {
      let viewsConfig = inv && inv.views
      let viewsPaths = viewsConfig && viewsConfig.map(v => path.join('src', 'http', v, path.sep))
      if (viewsPaths)
        return viewsPaths.some(p => dest.startsWith(p))
      else return dest.startsWith(path.join('src', 'http', 'get-'))
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
          update.done(`Hydrated app with src${path.sep}views`)
        let params = {
          cmd: 'copy',
          stdout: `Hydrated app with src${path.sep}views`,
          start,
          quiet: true
        }
        printer.done(params, callback)
      }
    }
    getBasePaths('views', function gotBasePaths(err, paths) {
      if (err) done(err)
      else {
        series(paths.map(dest=> {
          return function copier(callback) {
            if (isView(dest)) {
              let finalDest = path.join(dest, 'views')
              rmrf(finalDest, {glob:false}, function(err) {
                if (err) callback(err)
                else cp(views, finalDest, callback)
              })
            }
            else {
              callback()
            }
          }
        }), done)
      }
    })
  }
  else callback()
}
