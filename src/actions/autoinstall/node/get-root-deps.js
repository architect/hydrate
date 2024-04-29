let { existsSync, readFileSync } = require('fs')
let { join } = require('path')

// Get package[-lock].json contents and map out root dependency versions
module.exports = function getRootDeps ({ inv }) {
  let root = inv._project.cwd
  let packageJson = join(root, 'package.json')
  let packageLock = join(root, 'package-lock.json')

  let package = (existsSync(packageJson) && JSON.parse(readFileSync(packageJson))) || {}
  let deps = Object.assign(package.devDependencies || {}, package.dependencies || {})

  let lock = existsSync(packageLock) && JSON.parse(readFileSync(packageLock))
  // Top level lockfile deps only; we aren't going to walk the tree
  // Per npm: lockfileVersion 2 is backwards compatible with v1; however v3 will be a fully breaking change
  if (lock && [ 1, 2 ].includes(lock.lockfileVersion) && lock.dependencies) {
    let lockDeps = {}
    Object.entries(lock.dependencies).forEach(([ dep, data ]) => {
      if (!dep || !data.version || data.dev) return
      lockDeps[dep] = data.version
    })
    // Locked deps win
    deps = Object.assign(deps, lockDeps)
  }

  return deps
}
