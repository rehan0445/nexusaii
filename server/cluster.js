/**
 * Cluster Mode for Production - Handles 10k+ Concurrent Users
 * Spawns worker processes based on CPU cores
 */

import cluster from 'cluster';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`🚀 Master process ${process.pid} is running`);
  console.log(`🔧 Spawning ${numCPUs} worker processes for optimal performance...`);

  // Fork workers based on CPU count
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker exits and respawn
  cluster.on('exit', (worker, code, signal) => {
    console.warn(`⚠️ Worker ${worker.process.pid} died (${signal || code}). Respawning...`);
    cluster.fork();
  });

  // Log when workers are online
  cluster.on('online', (worker) => {
    console.log(`✅ Worker ${worker.process.pid} is online`);
  });

} else {
  // Workers can share any TCP connection
  // In this case, it's an HTTP server
  await import('./app.js');
  console.log(`👷 Worker ${process.pid} started`);
}

