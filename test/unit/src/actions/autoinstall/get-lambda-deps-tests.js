let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'actions', 'autoinstall', 'get-lambda-deps')
let getLambdaDeps = require(sut)
let mock = join(process.cwd(), 'test', 'mocks')
let { updater } = require('@architect/utils')
let update = updater('Hydrate')
let jsFiles = 8

test('Set up env', t => {
  t.plan(1)
  t.ok(getLambdaDeps, 'Dependency getter module is present')
})

test(`Walk CommonJS deps`, t => {
  t.plan(4)
  let stdout = process.stdout.write
  let data = ''
  process.stdout.write = write => {
    data += write
  }
  let inventory = { inv: { _project: {} } }
  let { deps, failures, files } = getLambdaDeps({ dir: join(mock, 'deps-cjs'), update, inventory })
  process.stdout.write = stdout
  let correct = [ '@a/package', '@b/package', 'c', 'd', 'e', 'f', 'g', 'h' ]

  t.deepEqual(deps.sort(), correct, `Got correct deps`)
  t.notOk(failures.length, 'Got no failures')
  t.equal(files.length, jsFiles, `Walked ${jsFiles} js files`)
  t.match(data, /'something'/, 'Warned about dynamic require')
})

test(`Walk ESM deps`, t => {
  t.plan(4)
  let stdout = process.stdout.write
  let data = ''
  process.stdout.write = write => {
    data += write
  }
  let inventory = { inv: { _project: {} } }
  let { deps, failures, files } = getLambdaDeps({ dir: join(mock, 'deps-esm'), update, inventory })
  process.stdout.write = stdout
  let correct = [ '@a/package', '@b/package', 'c', 'd', 'e', 'f', 'g', 'h' ]

  t.deepEqual(deps.sort(), correct, `Got correct deps`)
  t.notOk(failures.length, 'Got no failures')
  t.equal(files.length, jsFiles, `Walked ${jsFiles} js files`)
  t.match(data, /'something'/, 'Warned about dynamic require')
})

test(`Module systems can't mix`, t => {
  t.plan(5)
  let inventory = { inv: { _project: {} } }
  let dir = join(mock, 'deps-mixed')
  let { deps, failures, files } = getLambdaDeps({ dir, update, inventory })

  t.notOk(deps.length, 'Got no deps')
  t.equal(failures.length, 1, 'Got a failure')
  t.equal(failures[0].file, join(dir, 'no-bueno.js'), `Error found in correct file`)
  t.match(failures[0].error.message, /\'import\' and \'require\'/, `Got correct error`)
  t.equal(files.length, 2, 'Walked 2 js files')
})
