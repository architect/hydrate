let cp = require('./copy')
let fs = require('fs')
let path = require('path')
let series = require('run-series')
let getBasePaths = require('./get-base-paths')
let print = require('../_printer')
let {readArc} = require('@architect/utils')

/**
 * copies public/static.json
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs10.x | node_modules/@architect/shared/static.json
 * nodejs8.10 | node_modules/@architect/shared/static.json
 * python3.7  | vendor/shared/static.json
 * python3.6  | vendor/shared/static.json
 * ruby2.5    | vendor/shared/static.json
 *
 */
module.exports = function copyStatic(params, callback) {
  let {update, only} = params
  let go = !only || only === 'staticJson' || only === 'shared'

  let {arc} = readArc()
  let staticDir = 'public'
  if (arc.static && arc.static.some(i => i[0] === 'folder')) {
    staticDir = arc.static[arc.static.findIndex(i => i[0] === 'folder')][1] || 'public'
  }
  let static = path.join(process.cwd(), staticDir, 'static.json')
  let hasStatic = fs.existsSync(static)

  if (hasStatic && go) {
    // Kick off logging
    let done = `Hydrated app with static.json`
    let start = update.start(`Hydrating app with static.json`)

    function _done (err) {
      let cmd = 'copy'
      if (err) {
        print({cmd, err, start, update}, callback)
      }
      else {
        print({cmd, start, done, update}, callback)
      }
    }
    getBasePaths('static', function gotBasePaths(err, paths) {
      if (err) _done(err)
      else {
        series(paths.map(dest=> {
          return function copier(callback) {
            cp(static, path.join(dest, 'shared', 'static.json'), callback)
          }
        }), _done)
      }
    })
  }
  else callback()
}
