let { readFileSync } = require('fs')
let { builtinModules: builtins } = require('module')
let esprima = require('esprima')
let esquery = require('esquery')

module.exports = function getRequires ({ dir, file, update }) {
  let contents = readFileSync(file).toString()
  let ast = esprima.parse(contents, { tokens: true })
  let hasRequire = ast.tokens.some(({ value }) => value === 'require')

  // Exit early if module doesn't have any dependencies
  if (!hasRequire) return

  let called = []
  let requires = esquery.query(ast, `[callee.name='require']`)

  function getIdentifier (id) {
    let ids = esquery.query(ast, `[id.name='${id}']`) || []
    ids.forEach(r => {
      if (r.init.value) called.push(r.init.value)
      else update.warn(`Found dynamic require, dependency may not be installed: ${dir} requires '${id}'`)
    })
  }

  requires.forEach(r => {
    let arg = r.arguments && r.arguments[0]
    if (arg.type === 'Identifier') getIdentifier(arg.name)
    if (arg.type === 'Literal') called.push(arg.value)
  })

  let deps = called.filter(r => /^(\w|@)/.test(r) && !builtins.includes(r))

  return deps
}
