let { join } = require('path')
let { destroyPath } = require('../lib')

/**
 * Reset all node_modules/@architect shared folders
 */
module.exports = function resetShared (paths, callback) {
  let destroy = Object.values(paths.all).filter(p => p.includes('@architect'))
  if (destroy.length) {
    for (let path of destroy) {
      // Specifically destroy just @architect/shared + views
      destroyPath(join(path, 'shared'))
      destroyPath(join(path, 'views'))
    }
  }
  callback()
}
