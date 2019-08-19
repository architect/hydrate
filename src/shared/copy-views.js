let cp = require('./copy')
let rmrf = require('rimraf')
let fs = require('fs')
let path = require('path')
let series = require('run-series')
let getBasePaths = require('./get-base-paths')
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
module.exports = function copyArc(callback) {
  let inv
  getBasePaths('views', function gotBasePaths(err, paths) {
    if (err) throw err
    let update
    let views = path.join(process.cwd(), 'src', 'views')
    let hasViews = fs.existsSync(views)
    if (hasViews) {
      update = updater('Hydrate')
      update.start(`Hydrating app with src${path.sep}views`)
      if (!inv)
        inv = inventory()
    }
    series(paths.map(dest=> {
      return function copier(callback) {
        if (hasViews && isView(dest)) {
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
    }),
    function done(err) {
      if (err) callback(err)
      else {
        if (update)
          update.done(`Hydrated app with src${path.sep}views`)
        callback()
      }
    })
  })

  function isView (dest) {
    let viewsConfig = inv && inv.views
    let viewsPaths = viewsConfig && viewsConfig.map(v => path.join('src', 'http', v, path.sep))
    if (viewsPaths)
      return viewsPaths.some(p => dest.startsWith(p))
    else return dest.startsWith(path.join('src', 'http', 'get-'))
  }
}
