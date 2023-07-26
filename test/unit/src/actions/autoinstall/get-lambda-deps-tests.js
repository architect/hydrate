let { join } = require('path')
let test = require('tape')
let sut = join(process.cwd(), 'src', 'actions', 'autoinstall', 'node', 'get-lambda-deps')
let getLambdaDeps = require(sut)
let mock = join(process.cwd(), 'test', 'mocks')
let { updater } = require('@architect/utils')
let update = updater('Hydrate')
let jsFiles = 9
let correct = [ '@a/package', '@b/package', 'c', 'd', 'e', 'f', 'g', 'h' ]

test('Set up env', t => {
  t.plan(1)
  t.ok(getLambdaDeps, 'Dependency getter module is present')
})

test(`Walk CommonJS deps`, t => {
  t.plan(6)
  let stdout = process.stdout.write
  let data = ''
  process.stdout.write = write => {
    data += write
  }
  let inventory = { inv: { _project: {} } }
  let { deps, failures, files, awsSdkV2, awsSdkV3 } = getLambdaDeps({ dir: join(mock, 'deps-cjs'), update, inventory })
  process.stdout.write = stdout

  t.deepEqual(deps.sort(), correct, `Got correct deps`)
  t.notOk(failures.length, 'Got no failures')
  t.equal(files.length, jsFiles, `Walked ${jsFiles} js files`)
  t.match(data, /'something'/, 'Warned about dynamic require')
  t.ok(awsSdkV2, 'Found AWS SDK v2')
  t.ok(awsSdkV3, 'Found AWS SDK v3')
})

test(`Walk ESM deps`, t => {
  t.plan(6)
  let stdout = process.stdout.write
  let data = ''
  process.stdout.write = write => {
    data += write
  }
  let inventory = { inv: { _project: {} } }
  let { deps, failures, files, awsSdkV2, awsSdkV3 } = getLambdaDeps({ dir: join(mock, 'deps-esm'), update, inventory })
  process.stdout.write = stdout

  t.deepEqual(deps.sort(), correct, `Got correct deps`)
  t.notOk(failures.length, 'Got no failures')
  t.equal(files.length, jsFiles, `Walked ${jsFiles} js files`)
  t.match(data, /'something'/, 'Warned about dynamic require')
  t.ok(awsSdkV2, 'Found AWS SDK v2')
  t.ok(awsSdkV3, 'Found AWS SDK v3')
})

test(`Module systems can kind of mix (sometimes) but not really`, t => {
  t.plan(4)
  let inventory = { inv: { _project: {} } }
  let dir = join(mock, 'deps-mixed')
  let { deps, files, awsSdkV2, awsSdkV3 } = getLambdaDeps({ dir, update, inventory })

  // TODO such mixed ensure checks are only happening in ESM, not CJS; use Arc 10's `lambda.handlerModuleSystem`
  t.deepEqual(deps.sort(), [ 'a', 'b' ], `Got correct deps`)
  t.equal(files.length, 1, 'Walked 1 js file')
  t.notOk(awsSdkV2, 'Did not find AWS SDK v2')
  t.notOk(awsSdkV3, 'Did not find AWS SDK v3')
})
