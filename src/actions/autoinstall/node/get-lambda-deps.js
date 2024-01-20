let { join } = require('path')
let { globSync } = require('glob')
let { destroyPath, ignoreDeps } = require('../../../lib')
let getRequires = require('./find-lambda-deps')

module.exports = function getDirDeps ({ dir, update, inventory, ignored }) {
  // Clean everything (except the root) out before we get going jic
  let isRoot = dir === inventory.inv._project.cwd
  if (!isRoot) {
    destroyPath(join(dir, 'node_modules'))
  }

  // Collection of all dependencies from all files in this directory
  let deps = []

  // Userland files that could not be parsed
  let failures = []

  // Gather ye business logic while ye may
  let files = globSync('**/*.+(js|cjs|mjs)', { cwd: dir }).filter(ignoreDeps)
  files.forEach(f => {
    try {
      let requires = getRequires({ dir, file: join(dir, f), update })
      if (requires) deps = deps.concat(requires)
    }
    catch (error) {
      failures.push({ file: join(dir, f), error })
    }
  })

  // Tidy up the dependencies
  deps = [ ...new Set(deps.sort()) ] // Dedupe

  // Some version of AWS SDK is presumed to already be present at runtime
  // However, due to SDK version differences between older vs. newer Node.js Lambda containers, that may not actually necessarily be the case, so flag them
  let awsSdkV2 = deps.some(d => d === 'aws-sdk')
  let awsSdkV3 = deps.some(d => d.startsWith('@aws-sdk'))
  deps = deps.filter(d => d !== 'aws-sdk'
    && !d.startsWith('@aws-sdk')
    && (Array.isArray(ignored) ? !ignored.includes(d) : d !== ignored))

  return { deps, failures, files, awsSdkV2, awsSdkV3 }
}
