module.exports = {
  apps: [
    {
      name: 'Relayer service',
      script: 'dist/main.js',
      node_args: '-r dotenv/config',
    },
  ],
};
