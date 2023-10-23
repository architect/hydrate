# `@architect/hydrate` [![GitHub CI status](https://github.com/architect/hydrate/workflows/Node%20CI/badge.svg)](https://github.com/architect/hydrate/actions?query=workflow%3A%22Node+CI%22)

[@architect/hydrate][npm] ensures that all functions managed by Architect have their dependencies installed. Functions containing all required dependencies are considered to be 'hydrated' - thus the name!

[@architect/hydrate][npm] supports dependencies managed in the following languages using the following package managers:

- **Node.js** via `npm` using `package.json` (and optionally `package-lock.json`), or via `yarn` using `package.json` and `yarn.lock`
- **Python** via `pip3` using a `requirements.txt` file
- **Ruby** via `bundle` using `Gemfile` and `Gemfile.lock` files


# Installation

    npm install @architect/hydrate


# API

All methods accept an `options` object can include the following properties:

- `autoinstall` - **Boolean** - Enables or disables automated Lambda dependency treeshaking via static code analysis
  - Defaults to `false`
  - Used by `install`
- `basepath` - **String** - Filesystem path in which Hydrate should search for functions
  - Defaults the current working directory
  - Useful if you want to hydrate one function or a subset of functions
  - Used by `install` + `update`
- `copyShared` - **Boolean** - Enables or disables copying of shared code folders (e.g. `src/shared`) into Lambdas
  - Useful to disable if you want to just hydrate external dependencies
  - Defaults to `true`
  - Used by `install` + `update`
- `cwd` - **String** - Root filesystem path of the project Hydrate is working in
  - Defaults to current working directory
  - May be the same or different from `basepath`; if using in conjunction with `basepath`, specify a subset of the project with `basepath`, for example:
    - `{ cwd: '/your/project/', basepath: '/your/project/src/http/' }` runs Hydrate against `/your/project/` (without having to use `process.chdir`) and only hydrates functions within `/your/project/src/http/**`
  - Used by `install` + `update` + `shared`
- `hydrateShared` - **Boolean** - Enables or disables dependency hydration in shared code folders (e.g. `src/shared`)
  - Useful to disable if you want to just hydrate external dependencies
  - Defaults to `true`
  - Used by `install` + `update`
- `inventory` - **Object** - Architect Inventory object; generally used internally
- `local` - **Boolean** - Favor the local platform during installation of dependencies that may be distributed as platform-specific binaries
- `only` - **String** - Specify a subset of possible shared files for `shared` to copy into Lambdas
  - Falsy by default
  - Accepts: `shared`, `views`, or `staticJson`
  - Used by `shared`
- `quiet` - **Boolean** - Disables (most) logging
- `symlink` - **Boolean** - Enables or disables symlinking instead of full directory copying, useful for local development
  - Defaults to `false`
  - Used by `install` + `update` + `shared`
- `timeout` - **Number** - Amount of time in milliseconds to give each package manager process to execute
  - Used by `install` + `update`
- `verbose` - **Boolean** - Enables verbose logging

> **Note on `cwd` vs `basepath`**: `cwd` is necessary for Hydrate to find your project's manifest and key files and folders, while `basepath` scopes hydration to a specific path. When in doubt, include neither parameter, Hydrate will default to process working directory; if you know you need to aim Hydrate at a specific place but aren't sure which parameter to use, use `cwd`.


## `hydrate.install(options[, callback]) → [Promise]`

Installs function dependencies, then invokes [`hydrate.shared()`][shared].

To ensure local development behavior is as close to `staging` and `production` as possible, `hydrate.install()` (and other hydrate functions) uses:

- **Node.js**: `npm ci` if `package-lock.json` is present and `npm i` if not; or `yarn`
- **Python**: `pip3 install`
- **Ruby**: `bundle install`

Note: by default `update` also installs dependencies in shared folders like `src/shared` and `src/views`.


## `hydrate.update(options[, callback]) → [Promise]`

Updates function dependencies, then invokes [`hydrate.shared()`][shared].

`update` is functionally almost identical to [`install`][install], except it will update dependencies to newer versions _if they exist_. This is done via:

- **Node.js**: `npm update` or `yarn upgrade`
- **Python**: `pip3 install -U --upgrade-strategy eager`
- **Ruby**: `bundle update`

Note: by default `update` also updates dependencies in shared folders like `src/shared` and `src/views`.


## `hydrate.shared(options[, callback]) → [Promise]`

Copies shared code (from `src/shared` and `src/views`, or your custom `@shared` + `@views` paths, if any) into all functions.


[shared]: #hydratesharedoptions-callback
[install]: #hydrateinstalloptions-callback
[update]: #hydrateupdateoptions-callback
[npm]: https://www.npmjs.com/package/@architect/hydrate
