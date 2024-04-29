/**
 * Filter out excessive / unhelpful vendor logging that includes any of the following strings
 */
let strings = [
  'npm WARN prepare removing existing node_modules/ before installation',
]
let regexes = [
  /npm WARN .* No description/g,
  /npm WARN .* No repository field./g,
  /npm WARN .* No license field./g,
]

module.exports = function denoise (m) {
  return m.trim().split('\n')
    .filter(msg => msg && !strings.some(s => msg.includes(s)))
    .filter(msg => msg && !regexes.some(r => r.test(msg)))
    .join('\n').trim()
}
