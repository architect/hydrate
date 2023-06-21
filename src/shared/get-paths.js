let { join } = require('path')
let { existsSync } = require('fs')

/**
 * reads the Architect manifest and returns base paths to function runtime deps base
 */
module.exports = function getPaths (inventory) {
  let { lambdasBySrcDir, shared, views } = inventory.inv
  let paths = {
    all: {},
    shared: {},
    views: {},
  }

  function getPath (src, type) {
    // Don't create dirs for functions that don't already exist (or that we've already looked at)
    if (!existsSync(src) || (type && paths[type][src])) return

    let lambda = lambdasBySrcDir[src]
    if (Array.isArray(lambda)) lambda = lambda[0] // Multi-tenant Lambda check
    let { config } = lambda
    let nodeModules = join(src, 'node_modules', '@architect')
    let vendorDir = join(src, 'vendor')

    // Allow opting out of shared/views via config.arc @arc
    if (config.shared === false) return

    let path = config.runtime.startsWith('nodejs') ? nodeModules : vendorDir
    paths.all[src] = path
    if (type) paths[type][src] = path
  }

  if (shared?.shared) shared.shared.forEach(s => getPath(s, 'shared'))
  if (views?.views) views.views.forEach(v => getPath(v, 'views'))
  if (lambdasBySrcDir) Object.keys(lambdasBySrcDir).forEach(l => getPath(l))

  return paths
}
