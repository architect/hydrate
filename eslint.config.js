const arc = require('@architect/eslint-config')

module.exports = [
  ...arc,
  {
    ignores: [
      'scratch/',
      'test/mocks',
      'test/tmp',
    ],
  },
]
