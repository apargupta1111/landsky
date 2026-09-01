const path = require('path');

module.exports = {
  apps: [
    {
      name: 'landsky-backend-installer',
      script: 'server.js',
      cwd: path.join(__dirname, 'backend-installer'),
      env: {
        NODE_ENV: 'production',
      }
    }
  ]
};
