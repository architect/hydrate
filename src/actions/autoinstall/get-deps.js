let { existsSync, readFileSync } = require('fs')
let { join } = require('path')

// Get package[-lock].json contents and map out root dependency versions
module.exports = function getDeps ({ inv }) {
  let root = inv._project.src
  let packageJson = join(root, 'package.json')
  let packageLock = join(root, 'package-lock.json')

  let package = existsSync(packageJson) && JSON.parse(readFileSync(packageJson)) || {}
  let deps = Object.assign(package.devDependencies || {}, package.dependencies || {})

  let lock = existsSync(packageLock) && JSON.parse(readFileSync(packageLock))
  if (lock && lock.lockfileVersion === 1 && lock.dependencies) {
    let lockDeps = {}
    // Top level lockfile deps only; we aren't going to walk this tree
    Object.entries(lock.dependencies).forEach(([ dep, data ]) => {
      lockDeps[dep] = data.version
    })
    // Locked deps win
    deps = Object.assign(deps, lockDeps)
  }
  // TODO add npm 7 support (`lock.lockfileVersion === 2`)

  return deps
}
