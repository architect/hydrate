# Architect Hydrate changelog

---

## [3.5.1] 2023-11-19

### Added

- Added additional dependency ignoring property case: `ignoreDependencies` or `ignoredDependencies` can now be used; `ignoreDependencies` is preferred

---

## [3.5.0] 2023-10-31

### Added

- Added ability to ignore Lambdas during via `@arc hydrate false`; thanks @lpsinger!

---

## [3.4.0 - 3.4.1] 2023-10-23

### Added

- Added ability to ignore dependencies during hydration; thanks @andybee!


### Fixed

- Add `local` flag for hydration of platform-specific binary deps (namely: Python); fixes #1457
- Fixed pnpm / Yarn commands when globally installed

---

## [3.3.1] 2023-08-28

### Changed

- Optimistically import `importlib_metadata` during Python treeshaking in case it's already installed in the system

---

## [3.3.0] 2023-07-31

### Added

- Added initial support for Python Lambda treeshaking
  - No more `requirements.txt` necessary in your Python Lambdas, Architect now handles dependency installations automatically upon deployment
  - Docs: https://arc.codes/docs/en/guides/developer-experience/dependency-management#python
  - This supports global options passed in a root `requirements.txt` file (example: `--extra-index-url https://test.pypi.org/simple/`), but does not yet support dependencies versioned at root, or shared or views dependencies
  - All project dependencies must be installed on the system prior to deployment
  - Python Lambda treeshaking also requires the `pipdeptree` package to be available from shell; ensure you've run `pip3 install pipdeptree` prior to use

---

## [3.2.3] 2023-07-17

### Fixed

- Fixed issue using absolute paths in `hydrate.copy` plugins

---

## [3.2.2] 2023-06-21

### Fixed

- Added additional multi-tenant Lambda checks

---

## [3.2.1] 2023-04-22

### Changed

- Updated dependencies

---

## [3.2.0] 2023-03-12

### Added

- Added `pnpm` support; Hydrate will use pnpm if a `pnpm-lock.yaml` file is present, or if the `--pnpm` CLI flag is present; thanks @nicksrandall!
- Oh, also: added `--pnpm` + `--yarn` flags

---

## [3.1.12] 2023-03-09

### Changed

- Updated dependencies
- Internal changes: refactored globbing and filtering logic for Glob v9; partial refactor for npm 9's lockfileVersion 3

---

## [3.1.11] 2023-02-06

### Fixed

- Made hydrating Lambda handlers in the project root slightly less wonky (even possibly destructive); partially improves #1405

---

## [3.1.10] 2023-01-18

### Changed

- Updated dependencies

---

## [3.1.9] 2022-12-20

### Fixed

- Fixed `hydrate.copy` crashing when copying to multi-tenant Lambdae

---

## [3.1.8] 2022-12-06

### Fixed

- Fixed `hydrate.copy` API bug where files are copied to `vendor`, not `node_modules`, for `typescript` Lambdas

---

## [3.1.7] 2022-12-05

### Fixed

- Fixed `hydrate.copy` API bug where Lambda build dir is not used

---

## [3.1.6] 2022-11-18

### Added

- Added support for Lambda `nodejs18.x` runtime
- Added Node.js 18.x to test matrix


### Changed

- Ignore AWS SDK v3 (`@aws-sdk/*`) references during Lambda treeshaking
- Updated dependencies

---

## [3.1.5] 2022-11-15

### Changed

- Changed `hydrate.copy` API to copy files into all Lambdas, not just those with shared code enabled


### Fixed

- Fixed issue where `hydrate.copy` plugins breaking on projects that disabled or aren't using shared code; thanks @tbeseda!

---

## [3.1.4] 2022-10-07

### Fixed

- Fixed corner case where Lambda treeshaking could install a potentially out of date dependency if found in the project's developer dependencies tree, even if as a transient dependency of another package in `package-lock.json`
  - Per npm semantics, Architect assumes business logic that needs a specific version will use `dependencies`
  - If for whatever reason your Architect app's business logic depends on a specific dependency version, and that version is only found in `devDependencies`, you must specify that version in `dependencies`

---

## [3.1.3] 2022-09-07

### Changed

- Updated dependencies

---

## [3.1.0 - 3.1.2] 2022-08-20

### Added

- Added `hydrate.copy` API for copying in files and folders to Lambda dependency directories (`./path/to/lambda/node_modules/` or `./path/to/lambda/vendor`)


### Fixed

- Fixed issue where `hydrate.shared()` erroneously destroys the `@architect/functions` module; thanks @idy!
- Fixed issue where autoinstall would fail to parse `require` or `import` within for/of statements; fixes #1370

---

## [3.0.6] 2022-08-20

### Fixed

- Fix obscure case where copying `static.json` may fail when a shared folder is removed from the project; fixes #1367

---

## [3.0.5] 2022-08-11

### Fixed

- Handle obscure case where lingering broken symlinks would not be properly removed by the shared file copier

---

## [3.0.4] 2022-07-26

### Added

- Added support for Node.js 16's `node:` builtin module syntax; fixes #1358


### Changed

- Updated dependencies

---

## [3.0.3] 2022-05-10

### Changed

- Updated dependencies; sub-dep `lambda-runtimes` adds `nodejs16.x`.

---

## [3.0.2] 2022-03-31

### Changed

- Updated dependencies

---

## [3.0.0 - 3.0.1] 2022-01-13

### Added

- Added support for Arc 10 plugin API
- Added support for package-lock.json `lockfileVersion` 2; fixes #1306, thanks @gopeter!


### Changed

- Lambda treeshaking (currently for Node.js) is now the default when being run from CLI
- Breaking change: legacy `@tables-streams` folders (`src/tables/...` and `src/streams/...`) are now deprecated
- Breaking change: bare CLI arguments (e.g. `hydrate update`) as aliases to flags are no longer used, please use CLI flags (e.g. `hydrate --update` or `hydrate -u`)
- Stop publishing to the GitHub Package registry
- Traverse folders that start with `.` looking for Lambda package files to hydrate
- Updated dependencies


### Fixed

- Fixed issue where Lambdas configured with `@arc shared false` would still get shared code

---

## [2.2.3] 2022-01-11

### Fixed

- Fixed potential false tree shaking errors in ESM files that make use of `require()` (e.g. via `import { createRequire } from 'module'`)

---

## [2.2.2] 2022-01-10

### Fixed

- Fixed false positive tree shaking of `import`s from http(s)

---

## [2.2.1] 2022-01-09

### Fixed

- Fixed tree shaking detection of CJS/ESM when strings `import` and `require` are present in the AST

---

## [2.2.0] 2022-01-07

### Added

- Added support for Node.js 14 ESM Lambda tree shaking!

---

## [2.1.0] 2021-11-16

### Added

- Added support for `@tables-streams`, the fully customizable successor to `@tables` with `stream true`
  - Includes support for specifying multiple streams attached to a single table, as well as specifying custom source paths
  - For more see: https://arc.codes/tables-streams

---

## [2.0.4] 2021-10-12

### Changed

- Updated dependencies

---

## [2.0.3] 2021-09-23

### Fixed

- Fixed faulty error code path during shared file copying

---

## [2.0.0 - 2.0.2] 2021-07-22

### Changed

- Breaking change: removed support for Node.js 10.x (now EOL, and no longer available to created in AWS Lambda) and Node.js 12.x
- Breaking change: removed legacy `hydrate()` interface, usage should now always be `hydrate.install(opts)`, `hydrate.update(opts)`, or `hydrate.shared(opts)`; fixes #1168
- Breaking change: removed returning terminal output object
  - Hydration logging / output should now be retrieved via `utils.updater().get()`
- Breaking change: removed support for Architect 5 (and lower)
- Updated dependencies


### Fixed

- Fixed issue with `async/await` interface of Hydrate methods
- Improved output of terminal information being returned, especially in error scenarios

---

## [1.10.1 - 1.10.2] 2021-06-20

### Fixed

- Fixed issue where `@architect/functions` `arc.static()` method may not work if using `@static fingerprint true`, but aren't using `src/shared` or `@static src some-dir`


### Changed

- Updated dependencies

---

## [1.10.0] 2021-06-15

### Added

- Added `cwd` API param, making it easier to run Hydrate in different project directories
  - Since `cwd` and `basepath` have similar characteristics, please refer to the readme for usage!
- Added ability to pass API an `inventory` object (to prevent extra Inventory runs and avoid potential state issues)


### Changed

- Updated dependencies

---

## [1.9.11] 2021-05-24

### Fixed

- Hydration of plugin Lambdas now supports either plugin interface method
    `functions` or `pluginFunctions`.

---

## [1.9.10] 2021-05-17

### Fixed

- Fixed issue where Hydrate might get a bit overly aggressive and remove root dependencies during Lambda treeshaking; thanks @ryanbethel!

---

## [1.9.9] 2021-04-26

### Fixed

- Fixed `views` not hydrating in projects that don't use `shared`; fixes [#1133](https://github.com/architect/architect/issues/1133)

---

## [1.9.8] 2021-04-21

### Fixed

- Fixed issue where multiple lambdas aliased to the same source path would cause an error when hydrating `src/shared`; fixes [#1124](https://github.com/architect/architect/issues/1124)

---

## [1.9.7] 2021-04-12

### Fixed

- Fixed support for Lambdas created via `@plugins` to be hydrated with `src/shared`

---

## [1.9.6] 2021-03-02

### Added

- Add support for Lambdas created via `@plugins` to be hydrated

---

## [1.9.4 - 1.9.5] 2021-01-27

### Added

- Added `npx` bin for standalone CLI usage (`npx arc-hydrate`)


### Fixed

- Fixed `--autoinstall` flag not being detected by CLI
- Fixed autoinstall cleanup on machines that globally disable `package-lock.json`

---

## [1.9.3] 2021-01-23

### Added

- Added `installRoot` param to explicitly include the root directory in hydration operations


### Fixed

- Fixed printing correct number of functions to hydrate when Lambda treeshaking is involved

---


## [1.9.0 - 1.9.2] 2020-12-05

### Added

- Added support for automated dependency management (aka Lambda treeshaking) via `autoinstall` param
  - This feature currently only supports Node.js dependencies


### Fixed

- Fixed `npm` + `yarn` calls installing developer dependencies in Lambdas; fixes #1034, thanks @BenoitAverty!
- Fixed shared/views autoinstall package.json paths and path printing

---

## [1.8.0] 2020-12-03

### Added

- Added support for new `@shared` pragma with selective shared code, uh, sharing
- Added support for custom shared + views file paths


### Fixed

- Fixed obscure circumstance where moving or deleting a symlinked shared/views folder can crash hydration
  - Shared file copier now always deletes destination file dirs before writing instead of checking existence (which may result in false negatives for existence)

---

## [1.7.0] 2020-11-23

### Added

- Added support for custom file paths


### Changed

- Implemented Inventory (`@architect/inventory`)


### Fixed

- Ensure we don't create folders that don't already exist when copying shared / Arc files

---

## [1.6.2] 2020-11-04

### Fixed

- When using Yarn, detect local vs global installs, and prefer local installs where found (via `npx` call)

---

## [1.6.1] 2020-10-19

### Fixed

- Fixed weird side effects that can sometimes occur when toggling between symlink enabled/disabled with `@aws shared false` in a function config

---

## [1.6.0] 2020-10-15

### Added

- Added a `symlink` flag, which causes files and directories to be symlinked instead of copied (whenever the filesystem supports it). This should significantly improve performance in local workflows, such as Sandbox. Thanks @joliss!

---

## [1.5.1] 2020-09-30

### Added

- Add support for `@http` catchall syntax (e.g. `get /api/*`)


### Changed

- Updated dependencies

---

## [1.5.0] 2020-04-22

### Added

- Adds Yarn support!

---

## [1.4.20] 2020-03-22

### Changed

- Updated dependencies

---

## [1.4.18 - 1.4.19] 2020-03-02

### Changed

- Updated dependencies

---

## [1.4.17] 2020-02-05

### Changed

- Updated dependencies

---

## [1.4.16] 2020-02-04

### Fixed

- Fixed issue with shared code hydration in `python3.8`; fixes #650, thanks @rbuckingham!

---

## [1.4.15] 2020-01-22

### Changed

- Minor internal changes to ensure default runtime is now `nodejs12.x`
- Updated dependencies

---

## [1.4.14] 2020-01-21

### Fixed

- Fixed issue with hydration of `nodejs12.x` functions; thanks @bardbachmann!

---

## [1.4.13] 2020-01-06

### Changed

- Update dependencies

---

## [1.4.12] 2019-12-14

### Changed

- Changes hydration result `raw.err` (an error message) to an object containing `raw.err.message`, `raw.err.code`, and (if a signal was present in the error) `raw.err.signal`

---

## [1.4.11] 2019-11-19

### Changed

- Update dependencies

---

## [1.4.10] 2019-11-19

### Changed

- Update dependencies

---

## [1.4.9] 2019-10-12

### Fixed

- Fixes issue where legacy runtimes may not have been fully hydrated

---

## [1.4.8] 2019-10-11

### Changed

- Updated dependencies

---

## [1.4.5 - 1.4.7] 2019-09-29

### Added

- Added `hydrateShared` param (defaults `true`) to `install` and `update`; disabling deactivates hydrating `src/shared` and `src/views`, useful when only trying to hydrat dependencies for a single directory


### Fixed

- Fixed WebSocket function hydration


### Changed

- Updated dependencies

---

## [1.4.4] 2019-09-25

### Added

- Adds ability to target specific shared file operations by passing an `only` param to `hydrate.shared`
- This is largely just an internal change to make `sandbox` more efficient


### Changed

- Update dependencies

---

## [1.4.2 - 1.4.3] 2019-09-17

### Added

- In `hydrate.install` and `hydrate.update` shared copying is still enabled by default on all operations, but now you can opt out by passing a `copyShared` param


### Changed

- Internal change: moved tests into specific unit + integration dirs


### Fixed

- Fixed issue where shared file copy destination paths may leak across Lambda executions
- Fixed undefined message in init
- Improved printer error bubbling
- Formatting and line breaks in printer return should now more closely (or exactly) match console output
- Cleaned up printer API and implementation

---

## [1.4.1] 2019-09-11

### Changed

- `hydrate.update` now properly inventories its update operations, avoiding superfluous work
- Internal cleanup of printing operations using new Architect-standardized `updater`
- Results returned by `hydrate` are now symmetrical with what's printed
- Numerous internal changes to clean up common code paths and simplify key operations, like printing & reporting

---

## [1.4.0] 2019-09-06

### Added

- All `hydrate` printing is now silenced by using `quiet`


### Changed

- `hydrate.install` now properly inventories its update operations, avoiding superfluous work
- `hydrate.install` now accepts absolute `basepath` values (e.g. `/full/path/to/your/project`)
- `hydrate.install` and `hydrate.update` now always run `hydrate.shared`
- `hydrate.shared` now accepts parameters

---

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
