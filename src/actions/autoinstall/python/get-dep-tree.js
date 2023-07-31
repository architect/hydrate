let { spawnSync } = require('child_process')
let pipdeptree = false

module.exports = function getDepTree (topLevelDeps) {
  let shell = true

  if (!pipdeptree) {
    let pipdeptreeCheck = spawnSync('pip3', [ 'list' ], { shell })
    if (pipdeptreeCheck.status) {
      console.error(pipdeptreeCheck.output.toString())
      throw Error(`pip3 error`)
    }
    let packageList = pipdeptreeCheck.stdout.toString().split('\n')
    packageList.forEach(l => {
      if (pipdeptree) return
      if (l.split(' ')[0] === 'pipdeptree') pipdeptree = true
    })
    if (!pipdeptree) {
      throw Error(`pipdeptree required for treeshaking Python Lambdas, please run 'pip3 install pipdeptree'`)
    }
  }

  let cmd = 'pipdeptree'
  let args = [ '-fp', topLevelDeps.join(',') ]
  let raw = spawnSync(cmd, args, { shell })
  let { status, stdout } = raw
  if (status) {
    console.error(raw.output.toString())
    throw Error('Error getting Python dependency tree')
  }

  let seen = []
  let items = stdout.toString()
    .split('\n')
    .map(i => i.trim(i))
    .sort()
    .reverse()

  items = items.map(i => {
    let [ dep ] = i.split('==')
    if (!seen.includes(dep)) {
      seen.push(dep)
      return i
    }
  }).filter(Boolean)
  return items
}
