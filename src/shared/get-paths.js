let { join } = require('path')
let { existsSync } = require('fs')

/**
 * reads the Architect manifest and returns base paths to function runtime deps base
 */
module.exports = function getPaths (inventory) {
  let { inv } = inventory
  let paths = {}

  function getPath (src) {
    // Don't create dirs for functions that don't already exist (or that we've already looked at)
    if (!existsSync(src) || paths[src]) return
    // Ok, here we go
    let lambdae = inv.lambdasBySrcDir[src]
    // lambdasBySrcDir may be an object or array, depending on how many project lambdas are "aliased" to the same source path
    // in either case, the underlying source dir will have a single config with a single runtime defined, so we only need to check the runtime once
    if (!Array.isArray(lambdae)) lambdae = [ lambdae ]
    let lambda = lambdae[0]
    let { config } = lambda
    let nodeModules = join(src, 'node_modules', '@architect')
    let vendorDir = join(src, 'vendor')
    // Allow opting out of shared/views via config.arc @arc
    let path = config.runtime.startsWith('nodejs') ? nodeModules : vendorDir
    paths[src] = path
  }

  if (inv.shared && inv.shared.shared) inv.shared.shared.forEach(getPath)
  if (inv.views && inv.views.views) inv.views.views.forEach(getPath)

  return paths
}
