const { join } = require('path')
const { mkdtempSync, rmSync, writeFileSync } = require('fs')
const { tmpdir } = require('os')
const { test } = require('node:test')
const assert = require('node:assert')
const sut = join(process.cwd(), 'src', 'actions', 'autoinstall', 'node', 'get-root-deps')
const getRootDeps = require(sut)

function pkgify (deps, devDeps, lock) {
  let tmpl = { name: 'app' }
  if (deps) tmpl.dependencies = deps
  if (devDeps) tmpl.devDependencies = devDeps
  if (lock) tmpl.lockfileVersion = lock
  return JSON.stringify(tmpl, null, 2)
}

let cwd
let inventory = () => ({ inv: { _project: { cwd } } })
let run = fs => {
  cwd = mkdtempSync(join(tmpdir(), 'test-'))
  // Write files to temp directory
  for (let [ filename, content ] of Object.entries(fs)) {
    writeFileSync(join(cwd, filename), content)
  }
  let result = getRootDeps(inventory())
  rmSync(cwd, { recursive: true, force: true })
  return result
}

test('Set up env', async () => {
  assert.ok(getRootDeps, 'Dependency getter module is present')
})

test('package.json', async () => {
  let result

  result = run({ ok: 'hi' })
  assert.deepStrictEqual(result, {}, 'Got back empty object with no package.json present')
  console.log(result)

  let deps = {
    foo: '1.0.0',
    bar: '2.0.0',
  }
  result = run({ 'package.json': pkgify(deps) })
  assert.deepStrictEqual(result, deps, 'Got back dependencies (only)')
  console.log(result)

  let devDeps = {
    foo: '3.0.0',
    bar: '4.0.0',
  }
  result = run({ 'package.json': pkgify(null, devDeps) })
  assert.deepStrictEqual(result, devDeps, 'Got back devDependencies (only)')
  console.log(result)

  result = run({ 'package.json': pkgify(deps, devDeps) })
  assert.deepStrictEqual(result, deps, 'Dependencies won over devDependencies')
  console.log(result)
})

test('package.json + package-lock.json', async () => {
  let deps
  let lockDeps
  let correct
  let result

  // v1
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
  correct = {
    foo: '1.2.3',
    bar: '2.3.4',
  }
  assert.deepStrictEqual(result, correct, 'Got back specific dep versions from lockfile (lockfileVersion 1)')
  console.log(result)

  // v2
  result = run({
    'package.json': pkgify(deps),
    'package-lock.json': pkgify(lockDeps, null, 2),
  })
  assert.deepStrictEqual(result, correct, 'Got back specific dep versions from lockfile (lockfileVersion 2)')
  console.log(result)

  // v1
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
  correct = {
    foo: '^1.0.0',
    bar: '2.3.4',
    baz: '3.4.5',
  }
  assert.deepStrictEqual(result, correct, 'Merged dep versions from package + lockfile (lockfileVersion 1)')
  console.log(result)

  // v2
  result = run({
    'package.json': pkgify(deps),
    'package-lock.json': pkgify(lockDeps, null, 2),
  })
  assert.deepStrictEqual(result, correct, 'Merged dep versions from package + lockfile (lockfileVersion 2)')
  console.log(result)
})
