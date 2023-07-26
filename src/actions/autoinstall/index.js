let { renameSync, writeFileSync } = require('fs')
let { join } = require('path')
let treeshakeNode = require('./node')
let treeshakePython = require('./node')

module.exports = function autoinstaller (params) {
  let { dirs, update, verbose } = params
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

  let nodeResults = treeshakeNode(params)
  installing.push(...nodeResults.installing)
  projectDirs += nodeResults.projectDirs
  projectFiles += nodeResults.projectFiles
  nodeDeps += nodeResults.nodeDeps
  totalDeps += nodeResults.nodeDeps

  let pyResults = treeshakePython(params)
  installing.push(...pyResults.installing)
  projectDirs += pyResults.projectDirs
  projectFiles += pyResults.projectFiles
  pyDeps += pyResults.pyDeps
  totalDeps += pyResults.pyDeps

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
    if (nodeDeps.length) stats.push(`Installed ${nodeDeps} Node.js dependencies`)
    if (pyDeps.length) stats.push(`Installed ${pyDeps} Python dependencies`)
    stats.push(`Found a total of ${totalDeps} dependencies to install`)
    update.status('Dependency analysis', ...stats)
    update.done(`Completed in ${Date.now() - start}ms`)
  }
  else update.cancel()

  return installing
}
