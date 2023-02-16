function readPackage(pkg) {
  // ketcher-react is bad and uses a workspace protocol incorrectly. Errors with:
  //  ERR_PNPM_NO_MATCHING_VERSION_INSIDE_WORKSPACE  In : No matching version found for ketcher-core@* inside the workspace
  // So we patch that before pnpm install the package
  if (pkg.name === 'ketcher-react' || pkg.name === 'ketcher-standalone') {
    pkg.dependencies = {
      ...pkg.dependencies,
      "ketcher-core": pkg.version
    }
  }

  return pkg
}

module.exports = {
  hooks: {
    readPackage
  }
}
