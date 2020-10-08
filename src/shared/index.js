let fs = require('fs')
let path = require('path')
let series = require('run-series')
let stripAnsi = require('strip-ansi')
let copyShared = require('./copy-shared')
let copyViews = require('./copy-views')
let copyStaticJSON = require('./copy-static-json')
let copyArc = require('./copy-arc')
let { updater } = require('@architect/utils')

module.exports = function shared (params = {}, callback) {
  let { quiet, update } = params
  let shared = path.join(process.cwd(), 'src', 'shared')
  let views = path.join(process.cwd(), 'src', 'views')
  let hasShared = fs.existsSync(shared) || fs.existsSync(views)

  let start
  if (!update) {
    let updaterParams = { quiet }
    update = updater('Hydrate', updaterParams)
    params.update = update
  }
  if (hasShared)
    start = update.status('Hydrating app with shared files')

  series([
    function (callback) {
      copyShared(params, callback)
    },
    function (callback) {
      copyViews(params, callback)
    },
    function (callback) {
      copyStaticJSON(params, callback)
    },
    function (callback) {
      copyArc(params, callback)
    },
  ], function done (err, result) {
    if (err) callback(err)
    else {
      // Remove empty positions from series functions that skipped
      result = result.filter(r => r)
      if (start) {
        result.unshift({
          raw: stripAnsi(start),
          term: {
            stdout: start
          }
        })
      }
      callback(null, result)
    }
  })
}
