let { dirname, join, parse, sep } = require('path')
let { existsSync } = require('fs')
let child = require('child_process')
let series = require('run-series')
let print = require('../_printer')
let { destroyPath } = require('../lib')

module.exports = function hydrator (params, callback) {
  let { action, env, file, installing, inventory, local, shell, timeout, update, verbose } = params

  const root = parse(process.cwd()).root
  let cwd = dirname(file)
  if (!existsSync(cwd)) {
    cwd = join(root, dirname(file))
  }
  let options = { cwd, env, shell, timeout }
  let start, lambda
  let now = Date.now()
  let isRoot = cwd === '.'
  if (!isRoot) {
    let fullPath = join(inventory.inv._project.cwd, cwd)
    if (!existsSync(fullPath)) {
      fullPath = join(root, cwd)
    }
    lambda = inventory.inv.lambdasBySrcDir?.[fullPath]
  }

  // Prints and executes the command
  function exec (cmd, opts, callback) {
    let relativePath = isRoot ? 'project root' : cwd
    let done = `${action}ed ${relativePath}${sep}`
    start = update.start(`${action}ing ${relativePath}${sep}`)

    child.exec(cmd, opts, function (err, stdout, stderr) {
      // If zero output, acknowledge *something* happened
      if (!err && !stdout && !stderr) {
        update.cancel()
        stdout = `Done in ${(Date.now() - now) / 1000}s`
      }
      let params = { err, stdout, stderr, cmd, done, start, update, verbose }
      print(params, callback)
    })
  }

  let exists = file => existsSync(join(cwd, file))
  let isJs = file.endsWith('package.json')
  let isPy = file.endsWith('requirements.txt')
  let isRb = file.endsWith('Gemfile')

  let isNpmWithLockfile, isPnpm, isYarn
  if (isJs) {
    isNpmWithLockfile = exists('package-lock.json')
    isPnpm = params.pnpm || exists('pnpm-lock.yaml')
    isYarn = params.yarn || exists('yarn.lock')
  }

  function nativeModuleArgs () {
    let args = ''
    // Best effort ship to ship correct native modules to Lambda
    let deploying = inventory.inv._arc.deployStage
    if (deploying && !isRoot) {
      args += ` --os linux`
      if (lambda?.config?.architecture === 'arm64') args += ` --cpu arm64`
    }
    return args
  }

  series([
    function clear (callback) {
      if (installing) {
        // Remove existing package dir first to prevent side effects from symlinking
        let dir
        if (isJs) dir = join(cwd, 'node_modules')
        if (isPy) dir = join(cwd, 'vendor')
        if (isRb) dir = join(cwd, 'vendor', 'bundle')
        destroyPath(dir)
        callback()
      }
      else callback()
    },
    function install (callback) {
      // TODO: I think we should consider what minimum version of node/npm this
      // module needs to use as the npm commands below have different behaviour
      // depending on npm version - and enshrine those in the package.json

      // Install JS deps
      if (isJs && installing) {
        let prodFlag = isRoot ? '' : '--omit=dev'
        if (isNpmWithLockfile) {
          exec(`npm ci ${prodFlag + nativeModuleArgs()}`, options, callback)
        }
        else if (isPnpm) {
          prodFlag = isRoot ? '' : '--prod'
          let localPnpm
          try {
            require.resolve('pnpm')
            localPnpm = true
          }
          catch { /* noop */ }
          let cmd = localPnpm ? `npx pnpm i ${prodFlag}` : `pnpm i ${prodFlag}`
          exec(cmd, options, callback)
        }
        else if (isYarn) {
          let localYarn
          try {
            require.resolve('yarn')
            localYarn = true
          }
          catch { /* noop */ }
          localYarn = true
          let cmd = localYarn ? `npx yarn ${prodFlag}` : `yarn ${prodFlag}`
          exec(cmd, options, callback)
        }
        else /* Default to npm */ {
          exec(`npm i ${prodFlag + nativeModuleArgs()}`, options, callback)
        }
      }

      // Update JS deps
      else if (isJs && !installing) {
        if (isPnpm) {
          let localPnpm = exists(join(cwd, 'node_modules', 'pnpm'))
          let cmd = localPnpm ? 'npx pnpm update' : 'pnpm update'
          exec(cmd, options, callback)
        }
        else if (isYarn) {
          let localYarn = exists(join(cwd, 'node_modules', 'yarn'))
          let cmd = localYarn ? 'npx yarn upgrade' : 'yarn upgrade'
          exec(cmd, options, callback)
        }
        else {
          exec(`npm update`, options, callback)
        }
      }

      // Install Python deps
      // Things get super weird in here because of Python's sdist vs. wheel distribution in PyPI (and which Python versions, platforms, glibc versions, etc. each package has chosen to build for), platform tagging, AWS Linux glibc, and more...
      // tl;dr: this is all best-effort, but ultimately may not work, depending on the package in question
      else if (isPy) {
        let flags = ''
        if (lambda) {
          // Technique per AWS, found that `--python-version` was essential, but `--implementation cp` may not be
          // https://repost.aws/knowledge-center/lambda-python-package-compatible
          // This may still not work because of glibc version differences, see:
          // https://docs.aws.amazon.com/linux/al2023/ug/compare-with-al2.html#glibc-gcc-and-binutils
          let arch = lambda.config.architecture === 'arm64' ? 'manylinux2014_aarch64' : 'manylinux2014_x86_64'
          let ver = lambda.config.runtime.split('python')[1]
          flags = '--only-binary=:all: ' +
                  `--platform=${arch} ` +
                  `--python-version ${ver} `
          // Reset flags if installing from Sandbox
          if (local) flags = ''

          // Update Python deps
          if (!installing) {
            // TODO: pip requires manual locking (via two requirements.txt files) so we don't test update w/ python
            // ... thus, it may not make sense to execute this at all
            flags += '-U --upgrade-strategy eager'
          }
        }
        let cmd = `pip3 install -r requirements.txt -t ./vendor ${flags}`.trim()
        exec(cmd, options, callback)
      }

      // Install Ruby deps
      else if (isRb && installing) {
        exec(`bundle install --path vendor/bundle`, options, callback)
      }

      // Update Ruby deps
      else if (isRb && !installing) {
        exec(`bundle update`, options, callback)
      }

      else {
        callback()
      }
    },
  ], callback)
}
