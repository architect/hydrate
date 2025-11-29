const { join } = require('path')
const { test } = require('node:test')
const assert = require('node:assert')
const sut = join(process.cwd(), 'src', 'actions', 'autoinstall', 'node', 'get-lambda-deps')
const getLambdaDeps = require(sut)
const mock = join(process.cwd(), 'test', 'mocks')
const { updater } = require('@architect/utils')
const update = updater('Hydrate')
const jsFiles = 9
const correct = [ '@a/package', '@b/package', 'c', 'd', 'e', 'f', 'g', 'h' ]

test('Set up env', async () => {
  assert.ok(getLambdaDeps, 'Dependency getter module is present')
})

test('Walk CommonJS deps', async () => {
  let stdout = process.stdout.write
  let data = ''
  process.stdout.write = write => {
    data += write
  }
  let inventory = { inv: { _project: {} } }
  let { deps, failures, files, awsSdkV2, awsSdkV3 } = getLambdaDeps({ dir: join(mock, 'deps-cjs'), update, inventory })
  process.stdout.write = stdout

  assert.deepStrictEqual(deps.sort(), correct, 'Got correct deps')
  assert.ok(!failures.length, 'Got no failures')
  assert.strictEqual(files.length, jsFiles, `Walked ${jsFiles} js files`)
  assert.match(data, /'something'/, 'Warned about dynamic require')
  assert.ok(awsSdkV2, 'Found AWS SDK v2')
  assert.ok(awsSdkV3, 'Found AWS SDK v3')
})

test('Walk ESM deps', async () => {
  let stdout = process.stdout.write
  let data = ''
  process.stdout.write = write => {
    data += write
  }
  let inventory = { inv: { _project: {} } }
  let { deps, failures, files, awsSdkV2, awsSdkV3 } = getLambdaDeps({ dir: join(mock, 'deps-esm'), update, inventory })
  process.stdout.write = stdout

  assert.deepStrictEqual(deps.sort(), correct, 'Got correct deps')
  assert.ok(!failures.length, 'Got no failures')
  assert.strictEqual(files.length, jsFiles, `Walked ${jsFiles} js files`)
  assert.match(data, /'something'/, 'Warned about dynamic require')
  assert.ok(awsSdkV2, 'Found AWS SDK v2')
  assert.ok(awsSdkV3, 'Found AWS SDK v3')
})

test('Module systems can kind of mix (sometimes) but not really', async () => {
  let inventory = { inv: { _project: {} } }
  let dir = join(mock, 'deps-mixed')
  let { deps, files, awsSdkV2, awsSdkV3 } = getLambdaDeps({ dir, update, inventory })

  // TODO such mixed ensure checks are only happening in ESM, not CJS; use Arc 10's `lambda.handlerModuleSystem`
  assert.deepStrictEqual(deps.sort(), [ 'a', 'b' ], 'Got correct deps')
  assert.strictEqual(files.length, 1, 'Walked 1 js file')
  assert.ok(!awsSdkV2, 'Did not find AWS SDK v2')
  assert.ok(!awsSdkV3, 'Did not find AWS SDK v3')
})
