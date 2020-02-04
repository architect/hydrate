let parse = require('@architect/parser')
let {inventory, getRuntime} = require('@architect/utils')
let series = require('run-series')
let path = require('path')
let fs = require('fs')

/**
 * reads the Architect manifest and returns base paths to function runtime deps base
 *
 * @param {string} copying - one of: arcfile, shared, views, static
 */
module.exports = function getBasePaths(copying, callback) {
  let inv = inventory()
  series(inv.localPaths.map(base=> {

    let runtime = getRuntime() // Populates default
    let arcConfigPath = path.join(base, '.arc-config')
    let noop = false

    /**
     * Node: always copy into `node_modules/@architect/*`
     * Else: always copy into `vendor/*`
     */
    let nodeModules = path.join(base, 'node_modules', '@architect')
    let vendorDir = path.join(base, 'vendor')
    let basePath = r => r.startsWith('nodejs') ? nodeModules : vendorDir

    return function getPath(callback) {
      // check for override
      if (fs.existsSync(arcConfigPath)) {
        let raw = fs.readFileSync(arcConfigPath).toString()
        let config = parse(raw)
        // override runtime
        let findRuntime = t=> t[0] === 'runtime'
        if (config.aws && config.aws.some(findRuntime)) {
          runtime = config.aws.find(findRuntime)[1]
        }
        // toggle shared/views/arcfile/static
        let findCopying = t=> t[0] === copying
        if (config.arc && config.arc.some(findCopying)) {
          let val = config.arc.find(findCopying)[1]
          noop = (val === false || val === 'no' || val === 'disabled')
        }
      }
      if (noop) callback()
      else callback(null, basePath(runtime))
    }
  }),
  function done(err, results) {
    if (err) callback(err)
    else {
      callback(null, results.filter(Boolean))
    }
  })
}
