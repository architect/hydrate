let test = require('tape')
let { join } = require('path')
let mockFs = require('mock-fs')
// PUBLIC SERVICE ANNOUNCEMENT!
// if youre going to edit these tests, always remember to mockFs.restore() BEFORE you assert with tape because https://github.com/tschaub/mock-fs/issues/201
let getPaths = require('../../../../src/shared/get-paths')
let lambdaPath = join('app', 'src', 'http', 'get-items')
let lambdaPathMockFs = lambdaPath.replace(/\\/g, '/') // mock-fs expects unix paths, even on windows :|

test('inventory with a shared path to hydrate and a single node runtime lambda aliased to a single directory should return a path to node modules', t => {
  t.plan(1)
  mockFs({ [lambdaPathMockFs]: 'fake file contents' })
  let inventory = {
    inv: {
      shared: {
        shared: [ lambdaPath ]
      },
      lambdasBySrcDir: {
        [lambdaPath]: {
          name: 'get /items',
          config: { runtime: 'nodejs12' }
        }
      }
    }
  }
  let paths = getPaths(inventory)
  mockFs.restore()
  t.equals(paths[lambdaPath], join(lambdaPath, 'node_modules', '@architect'), 'node runtime lambda returns node_modules path')
})

test('inventory with a shared path to hydrate and a single non-node runtime lambda aliased to a single directory should return a path to vendor', t => {
  t.plan(1)
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
  mockFs.restore()
  t.equals(paths[lambdaPath], join(lambdaPath, 'vendor'), 'non-node runtime lambda returns vendor path')
})

test('inventory with a shared path to hydrate and multiple node runtime lambdas aliased to a single directory should return a single path to node_modules', t => {
  t.plan(1)
  let lambdaPath = join('app', 'src', 'http', 'get-items')
  mockFs({ [lambdaPathMockFs]: 'fake file contents' })
  let inventory = {
    inv: {
      shared: {
        shared: [ lambdaPath ]
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
  mockFs.restore()
  t.equals(paths[lambdaPath], join(lambdaPath, 'node_modules', '@architect'), 'node runtime lambda returns node_modules path')
})
