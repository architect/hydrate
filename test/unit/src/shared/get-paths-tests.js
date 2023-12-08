let test = require('tape')
let mockTmp = require('mock-tmp')
let { join } = require('path')
let getPaths = require('../../../../src/shared/get-paths')
let lambdaPath = join('app', 'src', 'http', 'get-items')

test('inventory with a shared path to hydrate and a single node runtime lambda aliased to a single directory should return a path to node modules', t => {
  t.plan(3)
  let tmp = mockTmp({ [lambdaPath]: 'fake file contents' })
  let path = join(tmp, lambdaPath)
  let inventory = {
    inv: {
      lambdasBySrcDir: {
        [path]: {
          name: 'get /items',
          config: { runtime: 'nodejs12' }
        }
      }
    }
  }
  let paths = getPaths(inventory)
  t.equals(paths.all[path], join(path, 'node_modules', '@architect'), 'node runtime lambda returns node_modules path (all)')
  t.notOk(Object.keys(paths.shared).length, 'Did not load any shared paths')
  t.notOk(Object.keys(paths.views).length, 'Did not load any views paths')
  mockTmp.reset()
})

test('inventory with a shared path to hydrate and a single non-node runtime lambda aliased to a single directory should return a path to vendor', t => {
  t.plan(3)
  let lambdaPath = join('app', 'src', 'http', 'get-items')
  let tmp = mockTmp({ [lambdaPath]: 'fake file contents' })
  let path = join(tmp, lambdaPath)
  let inventory = {
    inv: {
      shared: {
        shared: [ path ]
      },
      lambdasBySrcDir: {
        [path]: {
          name: 'get /items',
          config: { runtime: 'python3' }
        }
      }
    }
  }
  let paths = getPaths(inventory)
  t.equals(paths.all[path], join(path, 'vendor'), 'non-node runtime lambda returns vendor path (all)')
  t.equals(paths.shared[path], join(path, 'vendor'), 'non-node runtime lambda returns vendor path (shared)')
  t.notOk(Object.keys(paths.views).length, 'Did not load any views paths')
  mockTmp.reset()
})

test('inventory with a shared path to hydrate and multiple node runtime lambdas aliased to a single directory should return a single path to node_modules', t => {
  t.plan(3)
  let lambdaPath = join('app', 'src', 'http', 'get-items')
  let tmp = mockTmp({ [lambdaPath]: 'fake file contents' })
  let path = join(tmp, lambdaPath)
  let inventory = {
    inv: {
      views: {
        views: [ path ]
      },
      lambdasBySrcDir: {
        [path]: [
          { name: 'get /items', config: { runtime: 'nodejs12' } },
          { name: 'get /api/v1/items', config: { runtime: 'nodejs12' } },
          { name: 'get /api/v2/items', config: { runtime: 'nodejs12' } },
        ]
      }
    }
  }
  let paths = getPaths(inventory)
  t.equals(paths.all[path], join(path, 'node_modules', '@architect'), 'node runtime lambda returns node_modules path (all)')
  t.equals(paths.views[path], join(path, 'node_modules', '@architect'), 'node runtime lambda returns node_modules path (views)')
  t.notOk(Object.keys(paths.shared).length, 'Did not load any shared paths')
  mockTmp.reset()
})
