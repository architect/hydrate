let { join } = require('path')
let test = require('tape')
let mockFs = require('mock-fs')
let sut = join(process.cwd(), 'src', 'actions', 'autoinstall', 'get-root-deps')
let getRootDeps = require(sut)

function pkgify (deps, devDeps, lock) {
  let tmpl = { name: 'app' }
  if (deps) tmpl.dependencies = deps
  if (devDeps) tmpl.devDependencies = devDeps
  if (lock) tmpl.lockfileVersion = lock
  return JSON.stringify(tmpl, null, 2)
}
let inventory = { inv: { _project: { src: process.cwd() } } }
let run = fs => {
  mockFs(fs)
  let result = getRootDeps(inventory)
  mockFs.restore()
  return result
}

test('Set up env', t => {
  t.plan(1)
  t.ok(getRootDeps, 'Dependency getter module is present')
})

test('package.json', t => {
  t.plan(4)
  let result

  result = run({})
  t.deepEqual(result, {}, 'Got back empty object with no package.json present')
  console.log(result)

  let deps = {
    foo: '1.0.0',
    bar: '2.0.0',
  }
  result = run({ 'package.json': pkgify(deps) })
  t.deepEqual(result, deps, 'Got back dependencies (only)')
  console.log(result)

  let devDeps = {
    foo: '3.0.0',
    bar: '4.0.0',
  }
  result = run({ 'package.json': pkgify(null, devDeps) })
  t.deepEqual(result, devDeps, 'Got back devDependencies (only)')
  console.log(result)

  result = run({ 'package.json': pkgify(deps, devDeps) })
  t.deepEqual(result, deps, 'Dependencies won over devDependencies')
  console.log(result)
})

test('package.json + package-lock.json', t => {
  t.plan(2)
  let deps
  let lockDeps
  let correct
  let result

  deps = {
    foo: '^1.0.0',
    bar: '^2.0.0',
  }
  lockDeps = {
    foo: { version: '1.2.3' },
    bar: { version: '2.3.4' },
  }
  result = run({
    'package.json': pkgify(deps),
    'package-lock.json': pkgify(lockDeps, null, 1),
  })
  correct = deps = {
    foo: '1.2.3',
    bar: '2.3.4',
  }
  t.deepEqual(result, correct, 'Got back specific dep versions from lockfile')
  console.log(result)

  deps = {
    foo: '^1.0.0',
    bar: '^2.0.0',
  }
  lockDeps = {
    bar: { version: '2.3.4' },
    baz: { version: '3.4.5' },
  }
  result = run({
    'package.json': pkgify(deps),
    'package-lock.json': pkgify(lockDeps, null, 1),
  })
  correct = deps = {
    foo: '^1.0.0',
    bar: '2.3.4',
    baz: '3.4.5',
  }
  t.deepEqual(result, correct, 'Merged dep versions from package + lockfile')
  console.log(result)

  mockFs.restore()
})
