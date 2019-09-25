# Architect Hydrate changelog

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
