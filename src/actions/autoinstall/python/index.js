module.exports = function treeshakePython (/* params */) {

  let installing = []

  // Stats
  let projectDirs = 0
  let projectFiles = 0
  let pyDeps = 0

  return {
    installing,
    projectDirs,
    projectFiles,
    pyDeps,
  }
}
