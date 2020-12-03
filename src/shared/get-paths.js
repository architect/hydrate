let { join } = require('path')
let { existsSync } = require('fs')

/**
 * reads the Architect manifest and returns base paths to function runtime deps base
 */
module.exports = function getPaths (inventory) {
  let { inv } = inventory
  let paths = {}

  // Inspect the following pragmas with Lambdae
  let { http, events, queues, scheduled, streams, ws } = inv
  let pragmas = [ http, events, queues, scheduled, streams, ws ]
  pragmas.forEach(lambdas => {
    if (!lambdas) return
    lambdas.forEach(lambda => {
      let { src, config, arcStaticAssetProxy } = lambda
      // ASAP never gets shared files; Deploy directly writes static.json into ASAP dir
      if (arcStaticAssetProxy) return
      // Don't create dirs for functions that don't already exist
      if (!existsSync(src)) return
      // Ok, here we go
      let nodeModules = join(src, 'node_modules', '@architect')
      let vendorDir = join(src, 'vendor')
      // Allow opting out of shared/views via config.arc @arc
      let path = config.runtime.startsWith('nodejs') ? nodeModules : vendorDir
      paths[src] = path
    })
  })

  return paths
}
