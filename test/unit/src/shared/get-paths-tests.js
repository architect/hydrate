let test = require('tape')
let mockFs = require('mock-fs')
let { join } = require('path')
let getPaths = require('../../../../src/shared/get-paths')
let lambdaPath = join('app', 'src', 'http', 'get-items')
let lambdaPathMockFs = lambdaPath.replace(/\\/g, '/') // mock-fs expects unix paths, even on windows :|

test('inventory with a shared path to hydrate and a single node runtime lambda aliased to a single directory should return a path to node modules', t => {
  t.plan(3)
  mockFs({ [lambdaPathMockFs]: 'fake file contents' })
  let inventory = {
    inv: {
      lambdasBySrcDir: {
        [lambdaPath]: {
          name: 'get /items',
          config: { runtime: 'nodejs12' }
        }
      }
    }
  }
  let paths = getPaths(inventory)
  t.equals(paths.all[lambdaPath], join(lambdaPath, 'node_modules', '@architect'), 'node runtime lambda returns node_modules path (all)')
  t.notOk(Object.keys(paths.shared).length, 'Did not load any shared paths')
  t.notOk(Object.keys(paths.views).length, 'Did not load any views paths')
  mockFs.restore()
})

test('inventory with a shared path to hydrate and a single non-node runtime lambda aliased to a single directory should return a path to vendor', t => {
  t.plan(3)
  let lambdaPath = join('app', 'src', 'http', 'get-items')
  mockFs({ [lambdaPathMockFs]: 'fake file contents' })
  let inventory = {
    inv: {
      shared: {
        shared: [ lambdaPath ]
      },
      lambdasBySrcDir: {
        [lambdaPath]: {
          name: 'get /items',
          config: { runtime: 'python3' }
        }
      }
    }
  }
  let paths = getPaths(inventory)
  t.equals(paths.all[lambdaPath], join(lambdaPath, 'vendor'), 'non-node runtime lambda returns vendor path (all)')
  t.equals(paths.shared[lambdaPath], join(lambdaPath, 'vendor'), 'non-node runtime lambda returns vendor path (shared)')
  t.notOk(Object.keys(paths.views).length, 'Did not load any views paths')
  mockFs.restore()
})

test('inventory with a shared path to hydrate and multiple node runtime lambdas aliased to a single directory should return a single path to node_modules', t => {
  t.plan(3)
  let lambdaPath = join('app', 'src', 'http', 'get-items')
  mockFs({ [lambdaPathMockFs]: 'fake file contents' })
  let inventory = {
    inv: {
      views: {
        views: [ lambdaPath ]
      },
      lambdasBySrcDir: {
        [lambdaPath]: [
          { name: 'get /items', config: { runtime: 'nodejs12' } },
          { name: 'get /api/v1/items', config: { runtime: 'nodejs12' } },
          { name: 'get /api/v2/items', config: { runtime: 'nodejs12' } },
        ]
      }
    }
  }
  let paths = getPaths(inventory)
  t.equals(paths.all[lambdaPath], join(lambdaPath, 'node_modules', '@architect'), 'node runtime lambda returns node_modules path (all)')
  t.equals(paths.views[lambdaPath], join(lambdaPath, 'node_modules', '@architect'), 'node runtime lambda returns node_modules path (views)')
  t.notOk(Object.keys(paths.shared).length, 'Did not load any shared paths')
  mockFs.restore()
})
