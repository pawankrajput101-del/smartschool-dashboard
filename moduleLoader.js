// moduleLoader.js
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

function loadModule(moduleName) {
  // Path inside ASAR
  const modulePath = path.join(app.getAppPath(), 'modules', moduleName + '.js');

  if (fs.existsSync(modulePath)) {
    return require(modulePath);
  } else {
    throw new Error(`Module not found: ${moduleName}`);
  }
}

module.exports = { loadModule };
