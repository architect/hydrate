let cp = require('./copy')
let rmrf = require('rimraf')
let fs = require('fs')
let path = require('path')
let series = require('run-series')
let getBasePaths = require('./get-base-paths')
let print = require('../_printer')
let {inventory} = require('@architect/utils')

/**
 * copies src/views
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs10.x | node_modules/@architect/views/
 * nodejs8.10 | node_modules/@architect/views/
 * python3.7  | vendor/views/
 * python3.6  | vendor/views/
 * ruby2.5    | vendor/views/
 *
 */
module.exports = function copyViews(params, callback) {
  let {update, only} = params
  let views = path.join(process.cwd(), 'src', 'views')
  let hasViews = fs.existsSync(views)
  let go = !only || only === 'views'

  if (hasViews && go) {
    // Kick off logging
    let srcViews = `src${path.sep}views`
    let done = `Hydrated app with ${srcViews}`
    let start = update.start(`Hydrating app with ${srcViews}`)

    let inv
    if (!inv)
      inv = inventory()

    function isView (dest) {
      let viewsConfig = inv && inv.views
      let viewsPaths = viewsConfig && viewsConfig.map(v => path.join('src', 'http', v, path.sep))
      if (viewsPaths)
        return viewsPaths.some(p => dest.startsWith(p))
      else return dest.startsWith(path.join('src', 'http', 'get-'))
    }

    function _done (err) {
      let cmd = 'copy'
      if (err) {
        print({cmd, err, start, update}, callback)
      }
      else {
        print({cmd, start, done, update}, callback)
      }
    }
    getBasePaths('views', function gotBasePaths(err, paths) {
      if (err) _done(err)
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
        }), _done)
      }
    })
  }
  else callback()
}
