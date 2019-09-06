let cp = require('./copy')
let fs = require('fs')
let path = require('path')
let series = require('run-series')
let getBasePaths = require('./get-base-paths')
let printer = require('../_printer')
let {readArc, updater} = require('@architect/utils')

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
module.exports = function copyStatic(params, callback) {
  let {quiet} = params
  let {arc} = readArc()
  let staticDir = 'public'
  if (arc.static && arc.static.some(i => i[0] === 'folder')) {
    staticDir = arc.static[arc.static.findIndex(i => i[0] === 'folder')][1] || 'public'
  }
  let static = path.join(process.cwd(), staticDir, 'static.json')
  let hasStatic = fs.existsSync(static)
  let start
  let update // Always set quiet: true in updater, as updater will double-log to console

  if (hasStatic) {
    // Kick off logging
    start = printer.start({
      cwd: '',
      action: `Hydrating app with static.json`,
      quiet: true
    })
    if (!quiet) {
      update = updater('Hydrate')
      update.start(`Hydrating app with static.json`)
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
          update.done(`Hydrated app with static.json`)
        let params = {
          cmd: 'copy',
          stdout: `Hydrated app with static.json`,
          start,
          quiet: true
        }
        printer.done(params, callback)
      }
    }
    getBasePaths('static', function gotBasePaths(err, paths) {
      if (err) done(err)
      else {
        series(paths.map(dest=> {
          return function copier(callback) {
            cp(static, path.join(dest, 'shared', 'static.json'), callback)
          }
        }), done)
      }
    })
  }
  else callback()
}
