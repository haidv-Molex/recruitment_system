module.exports = {
  apps: [
    {
      name: "recruitment-system-server",
      script: "./dist/index.js",
      instances: "max",
      exec_mode: "cluster",
      watch: false, // watch is controlled via command-line args in 'npm run dev'
      max_memory_restart: "1G",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      env: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      }
    }
  ]
};
