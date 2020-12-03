# Architect Hydrate changelog

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
