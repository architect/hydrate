let { join } = require('path')

/**
 * reads the Architect manifest and returns base paths to function runtime deps base
 *
 * @param {string} copying - one of: arcfile, shared, views, static
 */
module.exports = function getPaths (inventory, copying) {
  let { inv } = inventory
  let paths = []

  // Inspect the following pragmas with Lambdae
  let { http, events, queues, scheduled, streams, ws } = inv
  let pragmas = [ http, events, queues, scheduled, streams, ws ]
  pragmas.forEach(lambdas => {
    if (!lambdas) return
    lambdas.forEach(lambda => {
      let { src, config, arcStaticAssetProxy } = lambda
      // ASAP never gets shared files; Package directly writes static.json into ASAP dir
      if (arcStaticAssetProxy) return
      if (!copying || config[copying] !== false) {
        let nodeModules = join(src, 'node_modules', '@architect')
        let vendorDir = join(src, 'vendor')
        // Allow opting out of shared/views via config.arc @arc
        let path = config.runtime.startsWith('nodejs') ? nodeModules : vendorDir
        paths.push(path)
      }
    })
  })

  return paths
}
