/**
 * PM2 config — only for the Hostinger VPS route (docs/DEPLOY-HOSTINGER.md, part B).
 *   pm2 start ecosystem.config.cjs && pm2 save
 * One instance on purpose: the guarantee sweep runs in-process (instrumentation.ts).
 */
module.exports = {
  apps: [
    {
      name: "waqtpe",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production", PORT: 3000 },
      max_memory_restart: "700M",
      time: true,
    },
  ],
};
