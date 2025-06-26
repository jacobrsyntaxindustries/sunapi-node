#!/usr/bin/env node

/**
 * Demo script for the SUNAPI Node.js SDK
 * This script demonstrates how to use the SDK without needing actual hardware
 */

import { Sunapi } from '../src/sunapi';

async function demo() {
  console.log('🎥 SUNAPI Node.js SDK Demo');
  console.log('========================');
  
  // Create a client instance
  const config = {
    host: '192.168.1.100',
    username: 'admin',
    password: 'admin123',
    protocol: 'http' as const,
    port: 80,
    timeout: 5000
  };
  
  const sunapi = new Sunapi(config);

  console.log('✅ Created SUNAPI client instance');
  console.log(`📡 Target: ${config.protocol}://${config.host}:${config.port || 80}`);
  
  // Show authentication status
  console.log(`🔐 Authentication status: ${sunapi.isAuthenticated() ? 'Authenticated' : 'Not authenticated'}`);
  
  // Demonstrate module availability
  console.log('\n📦 Available modules:');
  console.log(`  • System: ${sunapi.system ? '✅' : '❌'}`);
  console.log(`  • Video: ${sunapi.video ? '✅' : '❌'}`);
  console.log(`  • PTZ: ${sunapi.ptz ? '✅' : '❌'}`);
  console.log(`  • Events: ${sunapi.events ? '✅' : '❌'}`);
  console.log(`  • Recording: ${sunapi.recording ? '✅' : '❌'}`);
  
  // Show some example endpoint URLs that would be called
  console.log('\n🔗 Example API endpoints:');
  const systemClient = sunapi.system as any;
  console.log(`  • Device info: ${systemClient.buildCgiEndpoint('system', 'deviceinfo', 'view')}`);
  console.log(`  • System status: ${systemClient.buildCgiEndpoint('system', 'status', 'view')}`);
  console.log(`  • Video channels: ${systemClient.buildCgiEndpoint('video', 'channel', 'view')}`);
  console.log(`  • PTZ capabilities: ${systemClient.buildCgiEndpoint('ptz', 'capability', 'view')}`);
  console.log(`  • Event rules: ${systemClient.buildCgiEndpoint('event', 'rule', 'view')}`);
  
  // Demonstrate error handling without making actual requests
  console.log('\n🛡️ Error handling:');
  try {
    // This will demonstrate error handling for unauthenticated state
    console.log('  • Testing authentication requirement...');
    const authStatus = sunapi.isAuthenticated();
    console.log(`  • Auth check result: ${authStatus ? 'Ready' : 'Authentication required'}`);
  } catch (error) {
    console.log(`  • Error handling: ${(error as Error).message}`);
  }
  
  console.log('\n📚 To use with real hardware:');
  console.log('  1. Update the host IP address to your camera');
  console.log('  2. Set correct username and password');
  console.log('  3. Call await sunapi.connect() to authenticate');
  console.log('  4. Use the module methods like sunapi.system.getDeviceInfo()');
  
  console.log('\n🎯 SDK Features:');
  console.log('  • Type-safe TypeScript API');
  console.log('  • Automatic authentication handling');
  console.log('  • Comprehensive error handling');
  console.log('  • All SUNAPI modules supported');
  console.log('  • Built-in request/response parsing');
  console.log('  • CLI tool included');
  
  console.log('\n✨ Demo completed successfully!');
}

// Run the demo
demo().catch(console.error);
