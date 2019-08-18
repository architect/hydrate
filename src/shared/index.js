let fs = require('fs')
let path = require('path')
let series = require('run-series')
let copyArc = require('./copy-arc')
let copyShared = require('./copy-shared')
let copyViews = require('./copy-views')
let copyStaticJSON = require('./copy-static-json')
let {updater} = require('@architect/utils')

module.exports = function shared(callback) {
  let shared = path.join(process.cwd(), 'src', 'shared')
  let views = path.join(process.cwd(), 'src', 'views')
  let hasShared = fs.existsSync(shared) || fs.existsSync(views)
  if (hasShared)
    updater('Hydrate').status('Hydrating app with shared files')
  series([
    copyShared,
    copyViews,
    copyStaticJSON,
    copyArc,
  ], function done(err) {
    if (err) callback(err)
    else callback()
  })
}
