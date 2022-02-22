let { existsSync, readFileSync } = require('fs')
let { join } = require('path')

// Get params from root project that should be preserved in hydrated package.json
module.exports = function getRootParams ({ inv }) {
  let root = inv._project.cwd
  let packageJson = join(root, 'package.json')

  let package = existsSync(packageJson) && JSON.parse(readFileSync(packageJson)) || {}

  let result = {}
  if (package.overrides)
    result.overrides = package.overrides

  return result
}
