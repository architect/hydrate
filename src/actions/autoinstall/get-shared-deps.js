let { join } = require('path')
// Ok, not technically Lambdas here but whatev
let getLambdaDeps = require('./get-lambda-deps')

module.exports = function getSharedDeps ({ inventory, update }) {
  let { shared, views } = inventory.inv
  let relative = p => p.replace(process.cwd(), '').substr(1)

  let projectDirs = 0
  let projectFiles = 0

  let sharedDeps = []
  let sharedFiles = []
  if (shared) {
    projectDirs++
    let result = getLambdaDeps({ dir: shared.src, update })
    projectFiles += result.files.length
    sharedDeps = result.deps
    let dir = relative(shared.src)
    sharedFiles = result.files.map(f => join(dir, f))
  }

  let viewsDeps = []
  let viewsFiles = []
  if (views) {
    projectDirs++
    let result = getLambdaDeps({ dir: views.src, update })
    projectFiles += result.files.length
    viewsDeps = result.deps
    let dir = relative(views.src)
    viewsFiles = result.files.map(f => join(dir, f))
  }

  return {
    sharedDeps,
    sharedFiles,
    viewsDeps,
    viewsFiles,
    projectDirs,
    projectFiles,
  }
}
