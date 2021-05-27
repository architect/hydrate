let { pathToUnix } = require('@architect/utils')
let isDep = file => file.includes('node_modules') || file.includes('vendor/bundle') || file.includes('.deno_cache')
let ignoreDeps = file => !isDep(pathToUnix(file))

// Relativize by stripping leading relative path + `.`, `/`, `./`, `\`, `.\`
let stripCwd = f => f.replace(process.cwd(), '').replace(/^\.?\/?\\?/, '')

module.exports = {
  isDep,
  ignoreDeps,
  stripCwd,
}
