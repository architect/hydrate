# Hydrate [![Build Status](https://travis-ci.com/architect/hydrate.svg?branch=master)](https://travis-ci.com/architect/hydrate)

@architect/hydrate ensures that all functions managed by architect have their
dependencies installed. Functions with all required dependencies are considered
to be 'hydrated' - thus the name!

@architect/hydrate supports dependencies managed in the following languages
using the following package managers:

- **node.js** via `npm` using `package.json` and `package-lock.json` files
- **python (3.7+)** via `pip3` using a `requirements.txt` file
- **ruby** via `bundle` using `Gemfile` and `Gemfile.lock` files

# API

## `hydrate(options)`

By default, invokes [`hydrate.shared()`](#hydrate-shared). If `options.install`
is truthy, invokes [`hydrate.install()`](#hydrate-install). If `options.update`
is truthy, invokes [`hydrate.update()`](#hydrate-update).

## `hydrate.install()`

Installs dependencies for all Functions. Invokes
[`hydrate.shared()`](#hydrate-shared).

To ensure local development behavior is as close to `staging` and `production`
as possible, `hydrate.install()` (and other hydrate functions) uses:

- **node.js**: `npm ci` if `package-lock.json` is present and `npm i` if not
- **python**: `pip3 install`
- **ruby**: `bundle install`

## `hydrate.update()`

Updates dependencies in all Functions. Invokes
[`hydrate.shared()`](#hydrate-shared).

`update` is functionally almost identical to [`install`](#hydrate-install),
except it will update dependencies to newer versions _if they exist_. This is
done via:

- **node.js**: `npm update`
- **python**: `pip3 install -U --upgrade-strategy eager`
- **ruby**: `bundle update`

## `hydrate.shared()`

Copies shared code (from `src/shared` and `src/views`) into all Functions.
