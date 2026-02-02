/**
 * Environment Variable Check Utility
 * Validates that all required environment variables are set
 */

export function checkVeniceEnvironment() {
  const issues = [];
  const warnings = [];

  // Check VENICE_API_KEY
  if (!process.env.VENICE_API_KEY) {
    issues.push({
      variable: 'VENICE_API_KEY',
      severity: 'CRITICAL',
      message: 'Venice API key is not set',
      fix: 'Add VENICE_API_KEY to your environment variables'
    });
  } else if (process.env.VENICE_API_KEY === 'your_venice_api_key_here' || 
             process.env.VENICE_API_KEY === 'YOUR_API_KEY_HERE') {
    issues.push({
      variable: 'VENICE_API_KEY',
      severity: 'CRITICAL',
      message: 'Venice API key is set to placeholder value',
      fix: 'Replace with actual Venice API key'
    });
  } else if (process.env.VENICE_API_KEY.length < 20) {
    warnings.push({
      variable: 'VENICE_API_KEY',
      severity: 'WARNING',
      message: 'Venice API key seems too short',
      fix: 'Verify your API key is correct'
    });
  }

  // Check VENICE_MAX_CONCURRENT
  if (!process.env.VENICE_MAX_CONCURRENT) {
    warnings.push({
      variable: 'VENICE_MAX_CONCURRENT',
      severity: 'WARNING',
      message: 'Max concurrent requests not set (defaults to 50)',
      fix: 'Add VENICE_MAX_CONCURRENT=50 to optimize performance'
    });
  }

  // Check NODE_ENV
  if (!process.env.NODE_ENV) {
    warnings.push({
      variable: 'NODE_ENV',
      severity: 'WARNING',
      message: 'NODE_ENV not set (defaults to development)',
      fix: 'Set NODE_ENV=production for production deployments'
    });
  }

  return {
    success: issues.length === 0,
    issues,
    warnings,
    environment: {
      has_venice_key: !!process.env.VENICE_API_KEY,
      venice_key_valid: !!process.env.VENICE_API_KEY && 
                        process.env.VENICE_API_KEY !== 'your_venice_api_key_here' &&
                        process.env.VENICE_API_KEY.length >= 20,
      max_concurrent: process.env.VENICE_MAX_CONCURRENT || '50 (default)',
      node_env: process.env.NODE_ENV || 'development (default)'
    }
  };
}

export function logEnvironmentCheck() {
  const check = checkVeniceEnvironment();
  
  console.log('\n═══════════════════════════════════════════');
  console.log('🔍 Venice API Environment Check');
  console.log('═══════════════════════════════════════════\n');

  // Log environment status
  console.log('📊 Environment Configuration:');
  console.log(`   • Venice API Key: ${check.environment.has_venice_key ? '✅ Set' : '❌ Missing'}`);
  console.log(`   • API Key Valid: ${check.environment.venice_key_valid ? '✅ Yes' : '❌ No'}`);
  console.log(`   • Max Concurrent: ${check.environment.max_concurrent}`);
  console.log(`   • Node Environment: ${check.environment.node_env}\n`);

  // Log critical issues
  if (check.issues.length > 0) {
    console.log('❌ CRITICAL ISSUES:');
    check.issues.forEach(issue => {
      console.log(`   • ${issue.variable}: ${issue.message}`);
      console.log(`     Fix: ${issue.fix}\n`);
    });
  }

  // Log warnings
  if (check.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    check.warnings.forEach(warning => {
      console.log(`   • ${warning.variable}: ${warning.message}`);
      console.log(`     Fix: ${warning.fix}\n`);
    });
  }

  // Log success
  if (check.success && check.warnings.length === 0) {
    console.log('✅ All environment variables configured correctly!\n');
  }

  console.log('═══════════════════════════════════════════\n');

  return check;
}

/**
 * Startup check - run when server starts
 */
export function validateEnvironmentOnStartup() {
  const check = logEnvironmentCheck();
  
  if (!check.success) {
    console.error('❌ STARTUP FAILED: Critical environment variables missing!');
    console.error('   Venice API will not work until these issues are resolved.\n');
    
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️  In production mode - server will continue but Venice features will fail.\n');
    }
  }
  
  return check;
}

