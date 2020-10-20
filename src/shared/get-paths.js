let { join } = require('path')

/**
 * reads the Architect manifest and returns base paths to function runtime deps base
 *
 * @param {string} copying - one of: arcfile, shared, views, static
 */
module.exports = function getPaths (inventory, copying) {
  let { inventory: inv } = inventory
  let paths = []

  // Inspect the following pragmas with Lambdae
  let { http, events, queues, scheduled, streams, ws } = inv
  let pragmas = [ http, events, queues, scheduled, streams, ws ]
  pragmas.forEach(lambdas => {
    if (!lambdas) return
    lambdas.forEach(lambda => {
      let { src, config } = lambda
      let nodeModules = join(src, 'node_modules', '@architect')
      let vendorDir = join(src, 'vendor')
      if (config[copying] !== false) {
        let path = config.runtime.startsWith('nodejs') ? nodeModules : vendorDir
        paths.push(path)
      }
    })
  })

  return paths
}
