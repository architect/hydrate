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
  t.plan(4)
  let stdout = process.stdout.write
  let data = ''
  process.stdout.write = write => {
    data += write
  }
  let { deps, failures, files } = getLambdaDeps({ dir: mock, update })
  process.stdout.write = stdout
  let correct = [ 'a', 'b', 'c', 'd', 'e' ]

  t.deepEqual(deps.sort(), correct, `Got correct deps`)
  console.log(correct)

  t.notOk(failures.length, 'Got no failures')

  t.equal(files.length, 6, 'Scanned walked six js files')
  console.log(files.sort())

  t.ok(data.includes(`'something'`), 'Warned about dynamic require')
  console.log(data)
})
