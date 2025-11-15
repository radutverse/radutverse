function readPackage(pkg) {
  // Approve build scripts for binary modules
  if (pkg.name === 'sharp' || pkg.name === 'esbuild' || pkg.name === '@swc/core') {
    pkg.scripts = pkg.scripts || {};
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
