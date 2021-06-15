# `@architect/hydrate` [![GitHub CI status](https://github.com/architect/hydrate/workflows/Node%20CI/badge.svg)](https://github.com/architect/hydrate/actions?query=workflow%3A%22Node+CI%22)
<!-- [![codecov](https://codecov.io/gh/architect/hydrate/branch/master/graph/badge.svg)](https://codecov.io/gh/architect/hydrate) -->

[@architect/hydrate][npm] ensures that all functions managed by architect have
their dependencies installed. Functions containing all its required dependencies
are considered to be 'hydrated' - thus the name!

[@architect/hydrate][npm] supports dependencies managed in the following languages
using the following package managers:

- **node.js** via `npm` using `package.json` and `package-lock.json` files
- **python (3.7+)** via `pip3` using a `requirements.txt` file
- **ruby** via `bundle` using `Gemfile` and `Gemfile.lock` files

# Installation

    npm install @architect/hydrate

# API

## `hydrate(options)`

`options` object can include the following properties:

- `autoinstall` - **Boolean** - if truthy, enables automated Lambda dependency treeshaking via static code analysis; defaults to `false`
- `cwd` - **String** - root filesystem path of the project Hydrate is working in
  - Defaults to current working directory
  - May be the same or different from `basepath`; if using in conjunction with `basepath`, specify a subset of the project with `basepath`, for example:
    - `{ cwd: '/your/project/', basepath: '/your/project/src/http/' }` runs Hydrate against `/your/project/` (without having to use `process.chdir`) and only hydrates functions within `/your/project/src/http/**`
- `basepath` - **String** - filesystem path in which Hydrate should search for functions to hydrate
  - Defaults the current working directory
  - Useful if you want to hydrate one function or a subset of functions
- `install` - **Boolean** - if truthy, will invoke [`hydrate.install()`][install]
- `update` - **Boolean** - if truthy, will invoke [`hydrate.update()`][update]

By default, invokes [`hydrate.shared()`][shared].

> **Note on `cwd` vs `basepath`**: when in doubt, include neither parameter, Hydrate will default to process.cwd; if you know you need to aim Hydrate at a specific place but aren't sure which parameter to use, use `cwd`


## `hydrate.install(options, callback)`

Installs dependencies for all Functions found in the specified `basepath`. Invokes [`hydrate.shared()`][shared].

Note that for the default value of `basepath='src'`, this means `install` will also hydrate shared folders like `src/shared` and `src/views`.

To ensure local development behavior is as close to `staging` and `production` as possible, `hydrate.install()` (and other hydrate functions) uses:

- **node.js**: `npm ci` if `package-lock.json` is present and `npm i` if not
- **python**: `pip3 install`
- **ruby**: `bundle install`


## `hydrate.update(options, callback)`

Updates dependencies in all Functions found in the specified `basepath`. Invokes [`hydrate.shared()`][shared]. Note that this will only functionally differ from [`hydrate.install()`][install] if you use a lockfile like `package-lock.json` or `Gemfile.lock`.

Note that for the default value of `basepath='src'`, this means `update` will also update dependencies in shared folders like `src/shared` and `src/views`.

`update` is functionally almost identical to [`install`][install], except it will update dependencies to newer versions _if they exist_. This is done via:

- **node.js**: `npm update`
- **python**: `pip3 install -U --upgrade-strategy eager`
- **ruby**: `bundle update`


## `hydrate.shared(options, callback)`

Copies shared code (from `src/shared` and `src/views`) into all Functions.


[shared]: #hydratesharedoptions-callback
[install]: #hydrateinstalloptions-callback
[update]: #hydrateupdateoptions-callback
[npm]: https://www.npmjs.com/package/@architect/hydrate
