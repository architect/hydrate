let { pathToUnix } = require('@architect/utils')
let isDep = file => file.includes('node_modules') || file.includes('vendor/bundle') || file.includes('vendor')
let ignoreDeps = file => !isDep(pathToUnix(file))

// Relativize by stripping leading relative path + `.`, `/`, `./`, `\`, `.\`
let stripCwd = (f, cwd) => f.replace(cwd, '').replace(/^\.?\/?\\?/, '')

module.exports = {
  isDep,
  ignoreDeps,
  stripCwd,
}
