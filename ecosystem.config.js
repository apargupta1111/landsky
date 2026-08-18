module.exports = {
  apps: [
    {
      name: 'landsky-backend-installer',
      script: 'server.js',
      cwd: 'C:/Users/aparg/Desktop/smartlight/backend-installer',
      env: {
        NODE_ENV: 'production',
      }
    },
    {
      name: 'landsky-frontend',
      script: 'server.js',
      cwd: 'C:/Users/aparg/Desktop/smartlight/frontend',
      env: {
        NODE_ENV: 'production',
      }
    }
  ]
};
