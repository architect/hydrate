let { join } = require('path')
let { rmSync } = require('fs')
let { sync: glob } = require('glob')
let { ignoreDeps } = require('../../lib')
let getRequires = require('./find-lambda-deps')

module.exports = function getDirDeps ({ dir, update, inventory }) {
  // Clean everything (except the root) out before we get going jic
  let isRoot = dir === inventory.inv._project.cwd
  if (!isRoot) {
    rmSync(join(dir, 'node_modules'), { recursive: true, force: true })
  }

  // Collection of all dependencies from all files in this directory
  let deps = []

  // Userland files that could not be parsed
  let failures = []

  // Gather ye business logic while ye may
  let files = glob('**/*.+(js|cjs|mjs)', { cwd: dir }).filter(ignoreDeps)
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
  deps = deps.filter(d => d !== 'aws-sdk') // Already present at runtime

  return { deps, failures, files }
}
