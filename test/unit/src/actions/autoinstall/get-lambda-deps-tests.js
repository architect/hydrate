let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'actions', 'autoinstall', 'get-lambda-deps')
let getLambdaDeps = require(sut)
let mock = join(process.cwd(), 'test', 'mocks', 'deps')
let { updater } = require('@architect/utils')
let update = updater('Hydrate')

test('Set up env', t => {
  t.plan(1)
  t.ok(getLambdaDeps, 'Dependency getter module is present')
})

test(`Walk a folder's deps`, t => {
  t.plan(7)
  let stdout = process.stdout.write
  let data = ''
  process.stdout.write = write => {
    data += write
  }
  let inventory = { inv: { _project: {} } }
  let { deps, failures, files } = getLambdaDeps({ dir: mock, update, inventory })
  process.stdout.write = stdout
  let correct = [ '@a/package', '@b/package', 'c', 'd', 'e', 'f', 'g', 'h' ]

  t.deepEqual(deps.sort(), correct, `Got correct deps`)

  t.notOk(failures.length, 'Got no failures')

  t.equal(files.length, 6, 'Walked 6 js files')

  t.match(data, /'something'/, 'Warned about dynamic require')
  t.match(data, /'missingInit'/, 'Warned about reassigned require argument string')
  t.match(data, /'invalid module string'/, 'Warned about invalid module string')
  t.match(data, /'1234'/, 'Warned about non-string require argument')
})
