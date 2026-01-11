const { test } = require('node:test')
const assert = require('node:assert')
const { mkdtempSync, rmSync, mkdirSync, writeFileSync } = require('fs')
const { tmpdir } = require('os')
const { join } = require('path')
const getPaths = require('../../../../src/shared/get-paths')

test('inventory with a shared path to hydrate and a single node runtime lambda aliased to a single directory should return a path to node modules', async (t) => {
  const lambdaPath = join('app', 'src', 'http', 'get-items')
  const tmp = mkdtempSync(join(tmpdir(), 'test-'))
  t.after(() => rmSync(tmp, { recursive: true, force: true }))

  const fullLambdaPath = join(tmp, lambdaPath)
  mkdirSync(fullLambdaPath, { recursive: true })
  writeFileSync(join(fullLambdaPath, 'index.js'), 'fake file contents')

  let path = fullLambdaPath
  let inventory = {
    inv: {
      lambdasBySrcDir: {
        [path]: {
          name: 'get /items',
          config: { runtime: 'nodejs12' },
        },
      },
    },
  }
  let paths = getPaths(inventory)
  assert.strictEqual(paths.all[path], join(path, 'node_modules', '@architect'), 'node runtime lambda returns node_modules path (all)')
  assert.ok(!Object.keys(paths.shared).length, 'Did not load any shared paths')
  assert.ok(!Object.keys(paths.views).length, 'Did not load any views paths')
})

test('inventory with a shared path to hydrate and a single non-node runtime lambda aliased to a single directory should return a path to vendor', async (t) => {
  const lambdaPath = join('app', 'src', 'http', 'get-items')
  const tmp = mkdtempSync(join(tmpdir(), 'test-'))
  t.after(() => rmSync(tmp, { recursive: true, force: true }))

  const fullLambdaPath = join(tmp, lambdaPath)
  mkdirSync(fullLambdaPath, { recursive: true })
  writeFileSync(join(fullLambdaPath, 'index.py'), 'fake file contents')

  let path = fullLambdaPath
  let inventory = {
    inv: {
      shared: {
        shared: [ path ],
      },
      lambdasBySrcDir: {
        [path]: {
          name: 'get /items',
          config: { runtime: 'python3' },
        },
      },
    },
  }
  let paths = getPaths(inventory)
  assert.strictEqual(paths.all[path], join(path, 'vendor'), 'non-node runtime lambda returns vendor path (all)')
  assert.strictEqual(paths.shared[path], join(path, 'vendor'), 'non-node runtime lambda returns vendor path (shared)')
  assert.ok(!Object.keys(paths.views).length, 'Did not load any views paths')
})

test('inventory with a shared path to hydrate and multiple node runtime lambdas aliased to a single directory should return a single path to node_modules', async (t) => {
  const lambdaPath = join('app', 'src', 'http', 'get-items')
  const tmp = mkdtempSync(join(tmpdir(), 'test-'))
  t.after(() => rmSync(tmp, { recursive: true, force: true }))

  const fullLambdaPath = join(tmp, lambdaPath)
  mkdirSync(fullLambdaPath, { recursive: true })
  writeFileSync(join(fullLambdaPath, 'index.js'), 'fake file contents')

  let path = fullLambdaPath
  let inventory = {
    inv: {
      views: {
        views: [ path ],
      },
      lambdasBySrcDir: {
        [path]: [
          { name: 'get /items', config: { runtime: 'nodejs12' } },
          { name: 'get /api/v1/items', config: { runtime: 'nodejs12' } },
          { name: 'get /api/v2/items', config: { runtime: 'nodejs12' } },
        ],
      },
    },
  }
  let paths = getPaths(inventory)
  assert.strictEqual(paths.all[path], join(path, 'node_modules', '@architect'), 'node runtime lambda returns node_modules path (all)')
  assert.strictEqual(paths.views[path], join(path, 'node_modules', '@architect'), 'node runtime lambda returns node_modules path (views)')
  assert.ok(!Object.keys(paths.shared).length, 'Did not load any shared paths')
})
