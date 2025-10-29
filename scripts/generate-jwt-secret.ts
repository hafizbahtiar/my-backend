#!/usr/bin/env bun

/**
 * JWT Secret Generator
 * 
 * Generates a cryptographically secure JWT secret and updates .env file
 * 
 * Usage:
 *   bun run scripts/generate-jwt-secret.ts          # Updates .env (development)
 *   bun run scripts/generate-jwt-secret.ts --prod   # Updates .env (production)
 *   bun run scripts/generate-jwt-secret.ts --dev    # Updates .env.development
 *   bun run scripts/generate-jwt-secret.ts --test   # Updates .env.example
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Generate a cryptographically secure random secret
 */
function generateJWTSecret(length: number = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  
  // Convert to base64
  return Buffer.from(bytes).toString('base64');
}

/**
 * Read .env file
 */
function readEnvFile(filePath: string): string {
  if (!existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    console.log(`Creating new file...`);
    return '';
  }
  
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`❌ Error reading file: ${error}`);
    process.exit(1);
  }
}

/**
 * Write .env file
 */
function writeEnvFile(filePath: string, content: string): void {
  try {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Successfully updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error writing file: ${error}`);
    process.exit(1);
  }
}

/**
 * Update or add JWT_SECRET in .env content
 */
function updateJWTSecret(envContent: string, secret: string): string {
  const lines = envContent.split('\n');
  let found = false;
  
  // Look for existing JWT_SECRET line
  const updatedLines = lines.map(line => {
    if (line.trim().startsWith('JWT_SECRET=') || line.trim().startsWith('#JWT_SECRET=')) {
      found = true;
      return `JWT_SECRET=${secret}`;
    }
    return line;
  });
  
  // If not found, add it
  if (!found) {
    // Find a good place to insert (after other JWT config if exists)
    let insertIndex = updatedLines.length;
    
    for (let i = 0; i < updatedLines.length; i++) {
      if (updatedLines[i].includes('JWT') || updatedLines[i].includes('# JWT')) {
        // Insert after JWT section
        insertIndex = i + 1;
        // Skip empty line if present
        if (updatedLines[insertIndex]?.trim() === '') {
          insertIndex++;
        }
        break;
      }
    }
    
    updatedLines.splice(insertIndex, 0, `JWT_SECRET=${secret}`);
  }
  
  return updatedLines.join('\n');
}

/**
 * Main function
 */
function main() {
  console.log('🔐 Generating JWT Secret...\n');
  
  // Parse arguments
  const args = process.argv.slice(2);
  const isProd = args.includes('--prod');
  const isDev = args.includes('--dev');
  const isTest = args.includes('--test');
  
  // Determine file path
  let envFile: string;
  let envName: string;
  
  if (isProd) {
    envFile = '.env';
    envName = 'production (.env)';
  } else if (isDev) {
    envFile = '.env.development';
    envName = 'development (.env.development)';
  } else if (isTest) {
    envFile = '.env.example';
    envName = 'test/example (.env.example)';
  } else {
    envFile = '.env';
    envName = 'development (.env)';
  }
  
  console.log(`📝 Target file: ${envName}`);
  
  // Generate secret
  const secret = generateJWTSecret(32);
  console.log(`✅ Generated secure JWT secret (32 bytes, base64)`);
  console.log(`   Length: ${secret.length} characters\n`);
  
  // Read existing .env file
  const envPath = join(process.cwd(), envFile);
  let envContent = readEnvFile(envPath);
  
  // Update JWT_SECRET
  const updatedContent = updateJWTSecret(envContent, secret);
  
  // Write to file
  writeEnvFile(envPath, updatedContent);
  
  console.log(`\n🎉 JWT secret generated and saved successfully!`);
  console.log(`\n⚠️  Security reminder:`);
  console.log(`   - Keep your .env file secure`);
  console.log(`   - Never commit .env to version control`);
  console.log(`   - Use different secrets for each environment`);
}

// Run the script
main();
