#!/usr/bin/env node
/**
 * Generate a secure JWT_SECRET for Railway deployment
 * 
 * Usage: node generate-jwt-secret.js
 */

import crypto from 'crypto';

console.log('\n🔐 Generating secure JWT_SECRET for Railway...\n');

const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('━'.repeat(70));
console.log('JWT_SECRET (copy this to Railway):');
console.log('━'.repeat(70));
console.log(jwtSecret);
console.log('━'.repeat(70));

console.log('\n✅ Copy the value above and add it to Railway:\n');
console.log('   1. Go to your Railway project dashboard');
console.log('   2. Click on your service');
console.log('   3. Go to "Variables" tab');
console.log('   4. Click "New Variable"');
console.log('   5. Name: JWT_SECRET');
console.log('   6. Value: (paste the generated value)');
console.log('   7. Click "Add" and deploy\n');

