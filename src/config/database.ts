import mongoose from 'mongoose';
import { createTable } from '../utils/table';

/**
 * MongoDB Connection Configuration
 * 
 * This file handles the connection to MongoDB using Mongoose.
 * The connection is established when the application starts.
 */

/**
 * Get connection state text with emoji
 */
function getConnectionStateText(readyState: number): string {
  const stateMap: Record<number, string> = {
    0: '🔴 Disconnected',
    1: '🟢 Connected',
    2: '🟡 Connecting',
    3: '🟠 Disconnecting',
    99: '⚪ Uninitialized'
  };
  return stateMap[readyState] || '❓ Unknown';
}

/**
 * MongoDB Connection Configuration
 * 
 * This file handles the connection to MongoDB using Mongoose.
 * The connection is established when the application starts.
 */

// Connection options
const options = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  heartbeatFrequencyMS: 30000, // Send pings every 30 seconds
};

/**
 * Connect to MongoDB database
 * 
 * @throws Error if connection fails
 * @returns Promise<void>
 * 
 * @example
 * ```ts
 * import connectDB from '@/config/database';
 * 
 * await connectDB();
 * ```
 */
export async function connectDB(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Check if already connected (1 = connected)
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return;
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri, options);

    console.log('\n🎉 MongoDB connected successfully!');
    
    // Create dynamic database status table
    const dbInfo = [
      { label: 'Host', value: mongoose.connection.host || 'Unknown' },
      { label: 'Database', value: mongoose.connection.name || 'Unknown' },
      { label: 'Port', value: mongoose.connection.port?.toString() || 'Unknown' },
      { label: 'State', value: getConnectionStateText(mongoose.connection.readyState) },
    ];
    
    createTable('DATABASE STATUS', dbInfo);

    // Handle connection events
    setupConnectionHandlers();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB
 * 
 * Useful for graceful shutdown or testing
 * 
 * @returns Promise<void>
 * 
 * @example
 * ```ts
 * await disconnectDB();
 * ```
 */
export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
    throw error;
  }
}

/**
 * Setup MongoDB connection event handlers
 */
function setupConnectionHandlers(): void {
  const connection = mongoose.connection;

  // Connection successful
  connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
  });

  // Connection error
  connection.on('error', (error) => {
    console.error('❌ Mongoose connection error:', error);
  });

  // Connection disconnected
  connection.on('disconnected', () => {
    console.log('⚠️ Mongoose disconnected from MongoDB');
  });

  // Connection reconnected
  connection.on('reconnected', () => {
    console.log('🔄 Mongoose reconnected to MongoDB');
  });

  // Connection lost and cannot reconnect
  connection.on('reconnectFailed', () => {
    console.error('❌ Mongoose failed to reconnect to MongoDB');
    process.exit(1);
  });

  // Node process is about to be terminated
  process.on('SIGINT', async () => {
    await connection.close();
    console.log('⚠️ MongoDB connection closed through app termination');
    process.exit(0);
  });

  // Node process is about to be terminated (killed)
  process.on('SIGTERM', async () => {
    await connection.close();
    console.log('⚠️ MongoDB connection closed through app termination');
    process.exit(0);
  });
}

/**
 * Get MongoDB connection status
 * 
 * @returns Connection status object
 */
export function getConnectionStatus(): {
  isConnected: boolean;
  readyState: number;
  readyStateText: string;
} {
  const readyStates: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  };

  const readyState = mongoose.connection.readyState;

  return {
    isConnected: readyState === 1,
    readyState,
    readyStateText: readyStates[readyState] || 'unknown',
  };
}

/**
 * Default export for convenience
 */
export default connectDB;

