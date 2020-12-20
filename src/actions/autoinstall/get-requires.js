let { readFileSync } = require('fs')
let { builtinModules: builtins } = require('module')
let loose = require('acorn-loose')
let esquery = require('esquery')

module.exports = function getRequires ({ dir, file, update }) {
  let contents = readFileSync(file).toString()
  let tokens = []
  let opts = { ecmaVersion: 'latest', onToken: tokens }
  // Loose is a little gentler on userland code; we aren't here to judge code quality!
  let ast = loose.parse(contents, opts)
  let hasRequire = tokens.some(({ value }) => value === 'require')

  // Exit early if module doesn't require any dependencies
  if (!hasRequire) return

  let called = []
  let requires = esquery.query(ast, `[callee.name='require']`)

  // Traverse into require() args to get their (hopefully) static values
  function getIdentifier (id) {
    let ids = esquery.query(ast, `[id.name='${id}']`) || []
    ids.forEach(r => {
      if (r.init.value) called.push(r.init.value)
      else update.warn(`Dynamic requires are not supported, dependency may not be installed: ${dir} requires '${id}'`)
    })
  }

  requires.forEach(r => {
    let arg = r.arguments && r.arguments[0]
    if (arg.type === 'Identifier') getIdentifier(arg.name)
    if (arg.type === 'Literal') called.push(arg.value)
  })

  // Filter invalid package calls, Architect shared + views, and Node.js builtins
  let isPkg = /^(\w|@)/
  let isArcShared = /^@architect(\/|\\)(shared|views)/
  let deps = called.filter(r => isPkg.test(r) && !isArcShared.test(r) && !builtins.includes(r))

  function getDep (dep, sep) {
    return dep.startsWith('@')
      // Get '@foo/bar' from `@foo/bar' or '@foo/bar/baz/buz'
      ? dep.split(sep).slice(0, 2).join(sep)
      // Get 'foo' from `foo/bar' or 'foo/bar/baz'
      : dep.split(sep)[0]
  }

  deps = deps.map(dep => {
    if (dep.includes('/')) return getDep(dep, '/')
    if (dep.includes('\\')) return getDep(dep, '\\')
    return dep
  })

  return deps
}
