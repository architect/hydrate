let { existsSync, readFileSync } = require('fs')
let { join } = require('path')

module.exports = function getRootRequirementsConfig ({ inv }) {
  let root = inv._project.cwd
  let requirementsTxt = join(root, 'requirements.txt')

  let requirements = (existsSync(requirementsTxt) &&
                      readFileSync(requirementsTxt).toString().split('\n')) || []

  let requirementsConfig = requirements.filter(r => r.startsWith('--')).join('\n') + '\n'

  return requirementsConfig
}
