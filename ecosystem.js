module.exports = {
  apps: [{
    name: "yokinu",
    script: ".",
    watch: true,
    env: {
      "NODE_ENV": "production",
      "PORT": 80
    }
  }]
};