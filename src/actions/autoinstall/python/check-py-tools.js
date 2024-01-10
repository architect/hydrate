let { spawnSync } = require('child_process')

module.exports = function checkPyTools () {

  let cmd = 'python3'
  let args = [ '-m', 'pip', 'list' ]
  let raw = spawnSync(cmd, args, {
    cwd: __dirname,
    shell: true,
  })
  let { status, stdout } = raw

  if (status) throw Error(`pip3 not found`)

  let pipdeptree = false
  let packageList = stdout.toString().split('\n')
  packageList.forEach(l => {
    if (pipdeptree) return
    if (l.split(' ')[0] === 'pipdeptree') pipdeptree = true
  })
  if (!pipdeptree) {
    throw Error(`pipdeptree required for treeshaking Python Lambdas, please run 'python3 -m pip install pipdeptree'`)
  }
  return true
}
