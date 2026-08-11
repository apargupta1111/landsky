module.exports = {
  apps: [
    {
      name: "frontend",
      script: "node_modules/vite/bin/vite.js",
      args: "preview",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
