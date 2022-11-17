let { rmSync, unlinkSync } = require('fs')
let { pathToUnix } = require('@architect/utils')
let isDep = file => file.includes('node_modules') || file.includes('vendor/bundle')
let ignoreDeps = file => !isDep(pathToUnix(file))

function destroyPath (path) {
  rmSync(path, { recursive: true, force: true, maxRetries: 10 })
  // If there are stale symlinks lying about, rmSync will have missed them
  // So let's attempt an unlink jic, and all should be well
  try { unlinkSync(path) }
  catch { /* noop */ }
}

// Relativize by stripping leading relative path + `.`, `/`, `./`, `\`, `.\`
let stripCwd = (f, cwd) => f.replace(cwd, '').replace(/^\.?\/?\\?/, '')

module.exports = {
  destroyPath,
  isDep,
  ignoreDeps,
  stripCwd,
}
