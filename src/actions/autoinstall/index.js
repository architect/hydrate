let { renameSync, writeFileSync } = require('fs')
let { join } = require('path')
let treeshakeNode = require('./node')
let treeshakePython = require('./python')

module.exports = function autoinstaller (params) {
  let { dirs, inventory, update, verbose } = params
  if (!dirs.length) return []

  update.start('Finding dependencies')

  // Generated manifests to be hydrated later (if there are no parsing failures)
  let installing = []

  // Stats
  let start = Date.now()
  let projectDirs = 0
  let projectFiles = 0
  let nodeDeps = 0
  let pyDeps = 0
  let totalDeps = 0

  let nodeDirs = getRuntimeDirs(dirs, inventory, 'nodejs')
  if (nodeDirs.length) {
    let nodeResults = treeshakeNode(nodeDirs, params)
    installing.push(...nodeResults.installing)
    projectDirs += nodeDirs.length
    projectFiles += nodeResults.projectFiles
    nodeDeps += nodeResults.nodeDeps
    totalDeps += nodeResults.nodeDeps
  }

  let pyDirs = getRuntimeDirs(dirs, inventory, 'python')
  if (pyDirs.length) {
    let pyResults = treeshakePython(pyDirs, params)
    installing.push(...pyResults.installing)
    projectDirs += pyDirs.length
    projectFiles += pyResults.projectFiles
    pyDeps += pyResults.pyDeps
    totalDeps += pyResults.pyDeps
  }

  // Write everything at the end in case there were any parsing errors
  installing.forEach(({ dir, file, swap, data }) => {
    let manifest = join(dir, file)
    if (swap) {
      renameSync(manifest, join(dir, swap))
    }
    writeFileSync(manifest, data)
  })

  if (verbose) {
    let stats = [
      `Scanned ${projectDirs} project dirs`,
      `Inspected ${projectFiles} project files`,
    ]
    if (nodeDeps > 0) stats.push(`Installed ${nodeDeps} Node.js dependencies`)
    if (pyDeps > 0) stats.push(`Installed ${pyDeps} Python dependencies`)
    stats.push(`Found a total of ${totalDeps} dependencies to install`)
    update.status('Dependency analysis', ...stats)
    update.done(`Completed in ${Date.now() - start}ms`)
  }
  else update.cancel()

  return installing
}

function getRuntimeDirs (dirs, inventory, runtimeName) {
  let runtimeDirs = dirs.filter(dir => {
    let lambda = inventory.inv.lambdasBySrcDir?.[dir]
    if (!lambda) lambda = inventory.inv.http?.find(l => l.arcStaticAssetProxy)
    if (Array.isArray(lambda)) lambda = lambda[0] // Multi-tenant Lambda check
    let { runtime, hydrate } = lambda.config
    return runtime.startsWith(runtimeName) && hydrate !== false
  })
  return runtimeDirs
}
