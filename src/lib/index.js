let { pathToUnix } = require('@architect/utils')
let isDep = file => file.includes('node_modules') || file.includes('vendor/bundle') || file.includes('.deno_cache')
let ignoreDeps = file => !isDep(pathToUnix(file))

// Relativize by stripping leading relative path + `.`, `/`, `./`, `\`, `.\`
let stripCwd = (f, cwd) => f.replace(cwd, '').replace(/^\.?\/?\\?/, '')

let denoCacheable = [
  'index.js',
  'mod.js',
  'index.ts',
  'mod.ts',
  'index.tsx',
  'mod.tsx',
  'deps.ts'
]

let denoIgnore = [
  'package.json',
  'requirements.tex',
  'Gemfile'
]

module.exports = {
  isDep,
  ignoreDeps,
  stripCwd,
  denoCacheable,
  denoIgnore
}
