// server/src/server.ts
import app from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase, getConnectionStatus } from './config/database';
import mongoose from 'mongoose';

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    const server = app.listen(config.port, () => {
      const dbStatus = getConnectionStatus();
      const dbName = mongoose.connection.name || 'unknown';
      
      console.log('\n' + '='.repeat(50));
      console.log('🚀 BACKEND STATUS');
      console.log('='.repeat(50));
      console.log(`✅ Server: Running on port ${config.port}`);
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🔌 Database: ${dbStatus ? '✅ Connected' : '❌ Disconnected'}`);
      if (dbStatus) {
        console.log(`📊 Database Name: ${dbName}`);
      }
      console.log(`📚 Swagger API: http://localhost:${config.port}/ufo-docs`);
      console.log('='.repeat(50) + '\n');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} signal received: shutting down gracefully...`);
      
      server.close(async () => {
        console.log('✅ HTTP server closed');
        
        try {
          await disconnectDatabase();
          console.log('✅ Database disconnected');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

