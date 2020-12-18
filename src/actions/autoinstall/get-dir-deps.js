let { join } = require('path')
let { sync: rm } = require('rimraf')
let { sync: glob } = require('glob')
let { ignoreDeps } = require('../../lib')
let getRequires = require('./get-requires')

module.exports = function getDirDeps ({ dir, update }) {
  // Clean everything out bebefore we get going jic
  rm(join(dir, 'node_modules'))

  // Collection of all dependencies from all files in this directory
  let deps = []

  // Userland files that could not be parsed
  let failures = []

  // Gather ye business logic while ye may
  let files = glob('**/*.js', { cwd: dir }).filter(ignoreDeps)
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
