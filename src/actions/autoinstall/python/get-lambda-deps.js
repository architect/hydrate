let { spawnSync } = require('child_process')
let { join } = require('path')
let { destroyPath } = require('../../../lib')
let getDepTree = require('./get-dep-tree')

module.exports = function getDirDeps ({ dir, inventory, runtime }) {
  // Clean everything (except the root) out before we get going jic
  let isRoot = dir === inventory.inv._project.cwd
  if (!isRoot) {
    destroyPath(join(dir, 'vendor'))
  }

  let cmd = 'python3'
  let args = [ 'get_python_deps.py', runtime, dir ]
  let raw = spawnSync(cmd, args, {
    cwd: join(__dirname, 'py'),
    shell: true,
  })
  let { status, stdout } = raw
  if (status) {
    console.log(raw.output.toString())
    throw Error('Error getting Python dependencies')
  }

  let result = JSON.parse(stdout)
  let { failures, files } = result

  let deps = []
  if (result.deps.length && !failures.length) {
    deps = getDepTree(result.deps)
  }

  return { deps, failures, files }
}
