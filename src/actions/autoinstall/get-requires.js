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
      if (r.init && r.init.value) called.push(r.init.value)
      else update.warn(`Dynamic requires are not supported, dependency may not be installed: ${dir} requires '${id}'`)
    })
  }

  requires.forEach(r => {
    let arg = r.arguments && r.arguments[0]
    if (arg.type === 'Identifier') getIdentifier(arg.name)
    if (arg.type === 'Literal') called.push(arg.value)
  })

  function getPackageName (dep) {
    function getDep (dep, sep) {
      return dep.startsWith('@')
        // Get '@foo/bar' from `@foo/bar' or '@foo/bar/baz/buz'
        ? dep.split(sep).slice(0, 2).join(sep)
        // Get 'foo' from `foo/bar' or 'foo/bar/baz'
        : dep.split(sep)[0]
    }

    if (dep.includes('/')) return getDep(dep, '/')
    if (dep.includes('\\')) return getDep(dep, '\\')
    return dep
  }

  let deps = []

  // Filter invalid package calls, Architect shared + views, and Node.js builtins
  let isArcShared = /^@architect(\/|\\)(shared|views)/
  // https://www.npmjs.com/package/package-name-regex
  let isPkg = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/
  called.forEach(r => {
    if (typeof r === 'string') {
      let pkg = getPackageName(r)

      if (pkg && isPkg.test(pkg)) {
        if (!isArcShared.test(pkg) && !builtins.includes(pkg)) {
          deps.push(pkg)
        }
      }
      else  {
        update.warn(`Invalid module string '${pkg}' in require call found in ${dir}`)
      }
    }
    else {
      update.warn(`Non-string argument '${r}' passed to require() call`)
    }
  })

  return deps
}
