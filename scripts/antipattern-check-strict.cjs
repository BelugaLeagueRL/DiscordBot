#!/usr/bin/env node
/**
 * Strict Anti-Pattern Detection Script
 * Exits with error code 1 if any anti-patterns are found
 * Used as quality gate in CI/CD and pre-commit hooks
 */

const { execSync } = require('child_process');
const path = require('path');

// ANSI color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${colors.bold}${colors.blue}🔍 ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

let hasErrors = false;
let errorCount = 0;
const errorDetails = [];

/**
 * Run a command and check for patterns
 */
function checkPattern(command, description, errorMessage) {
  logHeader(`Checking: ${description}`);
  
  try {
    const output = execSync(command, { 
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (output.trim()) {
      // Found patterns - this is an error
      hasErrors = true;
      errorCount++;
      logError(`${errorMessage}`);
      
      // Log first few violations for context
      const lines = output.trim().split('\n');
      const maxShow = 5;
      log(`\n${colors.yellow}First ${Math.min(maxShow, lines.length)} violation(s):${colors.reset}`);
      lines.slice(0, maxShow).forEach(line => {
        log(`  ${line}`);
      });
      
      if (lines.length > maxShow) {
        log(`  ... and ${lines.length - maxShow} more violations`);
      }
      
      errorDetails.push({
        type: description,
        count: lines.length,
        message: errorMessage
      });
      
      log(''); // Add spacing
    } else {
      logSuccess(`No ${description.toLowerCase()} found`);
    }
  } catch (error) {
    // Command failed or no patterns found - this is success
    logSuccess(`No ${description.toLowerCase()} found`);
  }
}

/**
 * Main anti-pattern detection
 */
function main() {
  log(`${colors.bold}${colors.blue}=====================================`);
  log(`${colors.bold}${colors.blue}🛡️  STRICT ANTI-PATTERN DETECTION`);
  log(`${colors.bold}${colors.blue}=====================================${colors.reset}`);
  
  // 1. Free Ride Patterns (Multiple unrelated assertions)
  checkPattern(
    "rg 'expect.*expect' src/__tests__ --type ts",
    "Free Ride patterns (multiple unrelated assertions)",
    "Found tests with multiple unrelated assertions - violates 'One Assert Per Test' principle"
  );
  
  // 2. Slow Poke Patterns (Dynamic imports in tests)
  checkPattern(
    "rg 'await import\\(' src/__tests__ --type ts",
    "Slow Poke patterns (dynamic imports)",
    "Found dynamic imports in tests - can cause slow and unreliable tests"
  );
  
  // 3. Liar Patterns (Generic boolean assertions)
  checkPattern(
    "rg 'expect.*\\.toBe\\(true\\)$' src/__tests__ --type ts",
    "Liar patterns (generic boolean assertions)",
    "Found generic .toBe(true) assertions - provide no meaningful test information"
  );
  
  // 4. forEach Logic Patterns (Unsafe loops)
  checkPattern(
    "rg '\\.forEach\\(' src/__tests__ --type ts",
    "forEach Logic patterns (unsafe loops)",
    "Found .forEach() in tests - can cause unpredictable test behavior"
  );
  
  // 5. Hardcoded Tokens/Secrets
  checkPattern(
    "rg 'Bot [A-Za-z0-9]{20,}|token.*[A-Za-z0-9_-]{20,}|secret.*[A-Za-z0-9_-]{20,}' src/__tests__ --type ts",
    "Hardcoded tokens/secrets",
    "Found potential hardcoded tokens or secrets - SECURITY RISK"
  );
  
  // 6. Hardcoded API Keys
  checkPattern(
    "rg 'key.*[A-Za-z0-9_-]{20,}|apikey.*[A-Za-z0-9_-]{20,}' src/__tests__ --type ts",
    "Hardcoded API keys",
    "Found potential hardcoded API keys - security and maintainability risk"
  );
  
  // 7. Hardcoded Production URLs
  logHeader("Checking: Hardcoded production URLs");
  try {
    const urlOutput = execSync(
      "rg 'https://[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' src/__tests__ --type ts",
      { 
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'pipe'
      }
    );
    
    // Filter out acceptable test URLs
    const filteredOutput = execSync(
      "rg 'https://[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' src/__tests__ --type ts | grep -v 'example.com\\|localhost\\|127.0.0.1'",
      { 
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'pipe'
      }
    );
    
    if (filteredOutput.trim()) {
      hasErrors = true;
      errorCount++;
      logError("Found hardcoded production URLs - creates brittle tests");
      
      const urlLines = filteredOutput.trim().split('\n');
      const maxShow = 3;
      log(`\n${colors.yellow}First ${Math.min(maxShow, urlLines.length)} URL violation(s):${colors.reset}`);
      urlLines.slice(0, maxShow).forEach(line => {
        log(`  ${line}`);
      });
      
      if (urlLines.length > maxShow) {
        log(`  ... and ${urlLines.length - maxShow} more URL violations`);
      }
      
      errorDetails.push({
        type: "Hardcoded production URLs",
        count: urlLines.length,
        message: "Found hardcoded production URLs - creates brittle tests"
      });
      
      log('');
    } else {
      logSuccess("No hardcoded production URLs found");
    }
  } catch (error) {
    logSuccess("No hardcoded production URLs found");
  }
  
  // Summary
  log(`\n${colors.bold}${colors.blue}=====================================`);
  log(`${colors.bold}${colors.blue}📊 DETECTION SUMMARY`);
  log(`${colors.bold}${colors.blue}=====================================${colors.reset}`);
  
  if (hasErrors) {
    logError(`Found ${errorCount} anti-pattern categories with violations:`);
    errorDetails.forEach(detail => {
      log(`  • ${detail.type}: ${detail.count} violations`);
    });
    
    log('');
    logWarning("MANUAL EYE TEST STILL REQUIRED:");
    log("   Please manually verify no anti-patterns that automation cannot detect:");
    log("   • Hidden Free Ride (related but separate concerns in same test)");
    log("   • Subtle Liar patterns (non-generic but still meaningless assertions)");
    log("   • Logic in test setup that should be in production code");
    log("   • Over-mocking that hides real behavior");
    log("   • Tests that pass for wrong reasons");
    log("   • Hardcoded sensitive values (tokens, keys, secrets)");
    log("   📖 Review test focus, clarity, and genuine behavioral validation");
    
    log(`\n${colors.red}${colors.bold}💥 ANTI-PATTERN DETECTION FAILED${colors.reset}`);
    log(`${colors.red}Fix the violations above before proceeding.${colors.reset}`);
    
    process.exit(1);
  } else {
    logSuccess("All automated anti-pattern checks passed!");
    
    log('');
    logWarning("MANUAL EYE TEST STILL REQUIRED:");
    log("   Please manually verify no anti-patterns that automation cannot detect:");
    log("   • Hidden Free Ride (related but separate concerns in same test)");
    log("   • Subtle Liar patterns (non-generic but still meaningless assertions)");
    log("   • Logic in test setup that should be in production code");
    log("   • Over-mocking that hides real behavior");
    log("   • Tests that pass for wrong reasons");
    log("   • Hardcoded sensitive values (tokens, keys, secrets)");
    log("   📖 Review test focus, clarity, and genuine behavioral validation");
    
    log(`\n${colors.green}${colors.bold}✅ AUTOMATED ANTI-PATTERN DETECTION PASSED${colors.reset}`);
    
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };