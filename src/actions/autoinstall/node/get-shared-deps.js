let { join } = require('path')
// Ok, not technically Lambdas here but whatev
let getLambdaDeps = require('./get-lambda-deps')
let { stripCwd } = require('../../../lib')

module.exports = function getSharedDeps ({ cwd, inventory, update }) {
  let { shared, views } = inventory.inv

  let projectDirs = 0
  let projectFiles = 0

  let sharedDeps = []
  let sharedFiles = []
  let sharedAwsSdkV2
  let sharedAwsSdkV3
  if (shared) {
    projectDirs++
    let result = getLambdaDeps({ dir: shared.src, update, inventory })
    projectFiles += result.files.length
    sharedDeps = result.deps
    let dir = stripCwd(shared.src, cwd)
    sharedFiles = result.files.map(f => join(dir, f))
    sharedAwsSdkV2 = result.awsSdkV2
    sharedAwsSdkV3 = result.awsSdkV3
  }

  let viewsDeps = []
  let viewsFiles = []
  let viewsAwsSdkV2
  let viewsAwsSdkV3
  if (views) {
    projectDirs++
    let result = getLambdaDeps({ dir: views.src, update, inventory })
    projectFiles += result.files.length
    viewsDeps = result.deps
    let dir = stripCwd(views.src, cwd)
    viewsFiles = result.files.map(f => join(dir, f))
    viewsAwsSdkV2 = result.awsSdkV2
    viewsAwsSdkV3 = result.awsSdkV3
  }

  return {
    sharedDeps,
    sharedFiles,
    sharedAwsSdkV2,
    sharedAwsSdkV3,
    viewsDeps,
    viewsFiles,
    viewsAwsSdkV2,
    viewsAwsSdkV3,
    projectDirs,
    projectFiles,
  }
}
