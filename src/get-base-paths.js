let parse = require('@architect/parser')
let readArc = require('@architect/utils/read-arc')
let getLambdaName = require('@architect/utils/get-lambda-name')
let series = require('run-series')
let path = require('path')
let fs = require('fs')

/**
 * reads the Architect manifest and returns base paths to function runtime deps base
 *
 * @param {string} copying - one of: arcfile, shared, views, static
 */
let arc
module.exports = function getBasePaths(copying, callback) {
  if (!arc) {
    let config = readArc()
    arc = config.arc
  }
  series(arc.http.map(route=> {

    let name = `${route[0].toLowerCase()}${getLambdaName(route[1])}`
    let runtime = 'nodejs10.x'
    let base = path.join('src', 'http', name)
    let arcConfigPath = path.join(base, '.arc-config')
    let noop = false

    return function getPath(callback) {
      let paths = {
        'nodejs10.x': path.join(base, 'node_modules', '@architect'),
        'ruby2.5': path.join(base, 'vendor', 'bundle', 'architect-functions'),
        'python3.7': path.join(base, 'vendor', 'architect-functions'),
      }
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
      else callback(null, paths[runtime])
    }
  }),
  function done(err, results) {
    if (err) throw err
    callback(null, results.filter(Boolean))
  })
}
