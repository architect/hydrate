let { readFileSync } = require('fs')
let { builtinModules: builtins } = require('module')
let loose = require('acorn-loose')
let esquery = require('esquery')

module.exports = function findLambdaDeps ({ dir, file, update }) {
  let contents = readFileSync(file).toString()
  let tokens = []
  let opts = { ecmaVersion: 'latest', onToken: tokens }
  // Loose is a little gentler on userland code; we aren't here to judge code quality!
  let ast = loose.parse(contents, opts)
  let hasImport = tokens.some(({ value, type }) => value === 'import' && type?.label !== 'string')
  let hasRequire = tokens.some(({ value, type }) => value === 'require' && type?.label !== 'string')

  // Exit early if module doesn't require any dependencies
  if (!hasRequire && !hasImport) return

  let isESM = !!(hasImport)
  let statement = isESM ? 'imports' : 'requires'

  let called = []
  let esmQuery = `ImportExpression, ImportDeclaration, ExpressionStatement[expression.type='ImportExpression'], Property[key.name='import']`
  let query = `[callee.name='require']`
  if (isESM) query = query += ', ' + esmQuery
  let imports = esquery.query(ast, query)

  // Traverse into import() + require() args to get their (hopefully) static values
  function getIdentifier (id) {
    let ids = esquery.query(ast, `[id.name='${id}']`) || []
    ids.forEach(r => {
      // Note: r.init may be null in certain cases (such as variable declarations in for/of statements)
      if (r.init?.value) called.push(r.init.value)
      else update.warn(`Lambda treeshaking does not support dynamic ${statement}, dependency may not be installed: ${dir} ${statement} '${id}'`)
    })
  }

  imports.forEach(r => {
    let arg
    if (isESM) {
      if (r.expression)     arg = r.expression?.source
      else if (r.source)    arg = r.source
      else if (r.value)     arg = r.value?.params?.[0]
      else if (r.arguments) arg = r?.arguments?.[0]
    }
    else {
      arg = r?.arguments?.[0]
    }
    if (arg?.type === 'Identifier') getIdentifier(arg.name)
    if (arg?.type === 'Literal') called.push(arg.value)
  })

  // Filter invalid package calls, Architect shared + views, Node.js builtins, file:// + http[s]://
  let isPkg = /^(\w|@)/
  let isArcShared = /^@architect(\/|\\)(shared|views)/
  let isFile = /^file:\/\//
  let isBuiltin = /^node:/
  let isWeb = /^https?:\/\//
  let deps = called.filter(r => isPkg.test(r) && !isArcShared.test(r) && !isFile.test(r) && !isBuiltin.test(r) && !isWeb.test(r) && !builtins.includes(r))

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
