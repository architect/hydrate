let { join } = require('path')
let { existsSync } = require('fs')

/**
 * reads the Architect manifest and returns base paths to function runtime deps base
 */
module.exports = function getPaths (inventory) {
  let { inv } = inventory
  let paths = {}

  if (inv.shared && inv.shared.shared) inv.shared.shared.forEach(src => {
    // Don't create dirs for functions that don't already exist
    if (!existsSync(src)) return
    // Ok, here we go
    let { config } = inv.lambdasBySrcDir[src]
    let nodeModules = join(src, 'node_modules', '@architect')
    let vendorDir = join(src, 'vendor')
    // Allow opting out of shared/views via config.arc @arc
    let path = config.runtime.startsWith('nodejs') ? nodeModules : vendorDir
    paths[src] = path
  })

  return paths
}
