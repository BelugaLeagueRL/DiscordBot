#!/usr/bin/env node

/**
 * Advanced Free Ride Anti-Pattern Detection Script
 * Detects multiple unrelated assertions within a single test
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findTestFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir);
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (entry.endsWith('.test.ts') || entry.endsWith('.test.js')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function analyzeTestFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  // Parse test blocks
  const testBlocks = [];
  let currentTest = null;
  let braceDepth = 0;
  let inTestBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detect test start
    if (trimmed.match(/^\s*it\s*\(/)) {
      currentTest = {
        name: trimmed,
        startLine: i + 1,
        endLine: i + 1,
        expects: [],
        content: []
      };
      inTestBlock = true;
      braceDepth = 0;
    }
    
    if (inTestBlock) {
      currentTest.content.push(line);
      
      // Count braces to find test end
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceDepth += openBraces - closeBraces;
      
      // Find expect statements
      if (trimmed.includes('expect(')) {
        const expectMatch = trimmed.match(/expect\([^)]*\)\s*\.\s*(\w+)/);
        if (expectMatch) {
          currentTest.expects.push({
            line: i + 1,
            method: expectMatch[1],
            full: trimmed,
            content: line
          });
        }
      }
      
      // End of test block
      if (braceDepth <= 0 && openBraces === 0 && closeBraces > 0) {
        currentTest.endLine = i + 1;
        testBlocks.push(currentTest);
        inTestBlock = false;
        currentTest = null;
      }
    }
  }
  
  // Analyze each test for Free Ride patterns
  for (const test of testBlocks) {
    if (test.expects.length >= 3) {
      // Check for unrelated assertions
      const patterns = analyzeFreeRidePatterns(test);
      if (patterns.length > 0) {
        issues.push({
          file: filePath,
          test: test.name,
          startLine: test.startLine,
          endLine: test.endLine,
          patterns: patterns,
          expectCount: test.expects.length,
          expects: test.expects
        });
      }
    }
  }
  
  return issues;
}

function analyzeFreeRidePatterns(test) {
  const patterns = [];
  const expects = test.expects;
  
  if (expects.length < 4) return patterns; // Raise threshold - 3 assertions can be legitimate
  
  // Extract what's being tested
  const testSubjects = expects.map(e => {
    const match = e.full.match(/expect\(([^)]+)\)/);
    const fullExpression = match ? match[1].trim() : '';
    return analyzeTestSubject(fullExpression);
  }).filter(Boolean);
  
  // **REAL** Free Ride Pattern 1: Testing completely unrelated business domains
  const businessDomains = categorizeByBusinessDomain(testSubjects);
  if (businessDomains.length >= 3) {
    patterns.push({
      type: 'multiple_business_domains',
      description: `Tests unrelated business domains: ${businessDomains.join(', ')}`,
      severity: 'high',
      details: `This indicates multiple unrelated business concerns in one test`
    });
  }
  
  // **REAL** Free Ride Pattern 2: Testing setup + business logic + cleanup in same test
  const setupAssertions = expects.filter(e => 
    e.full.includes('mockSetup') || e.full.includes('beforeEach') || e.full.includes('configure'));
  const businessAssertions = expects.filter(e => 
    e.full.includes('.success') || e.full.includes('.error') || e.full.includes('.result') || e.full.includes('.data'));
  const cleanupAssertions = expects.filter(e => 
    e.full.includes('mockRestore') || e.full.includes('cleanup') || e.full.includes('reset'));
  
  if (setupAssertions.length >= 1 && businessAssertions.length >= 1 && cleanupAssertions.length >= 1) {
    patterns.push({
      type: 'setup_business_cleanup_mix',
      description: `Tests setup (${setupAssertions.length}), business logic (${businessAssertions.length}), and cleanup (${cleanupAssertions.length}) together`,
      severity: 'high',
      details: `These are different phases of testing and should be separated`
    });
  }
  
  // **REAL** Free Ride Pattern 3: Testing multiple independent external services
  const externalServices = identifyExternalServices(testSubjects);
  if (externalServices.length >= 2) {
    patterns.push({
      type: 'multiple_external_services',
      description: `Tests multiple external services: ${externalServices.join(', ')}`,
      severity: 'high',
      details: `Each external service should be tested in isolation`
    });
  }
  
  // **REAL** Free Ride Pattern 4: Massive test (10+ assertions) with mixed concerns
  if (expects.length >= 10) {
    const concernTypes = analyzeConcernTypes(expects);
    if (concernTypes.length >= 3) {
      patterns.push({
        type: 'massive_mixed_concerns',
        description: `Has ${expects.length} assertions across ${concernTypes.length} concern types: ${concernTypes.join(', ')}`,
        severity: 'high',
        details: `Large tests with mixed concerns are hard to maintain and understand`
      });
    }
  }
  
  return patterns;
}

function analyzeTestSubject(expression) {
  // Extract the base concept being tested
  const parts = expression.split('.');
  const base = parts[0];
  const property = parts[1];
  
  return {
    base: base,
    property: property,
    fullExpression: expression,
    domain: inferBusinessDomain(expression)
  };
}

function inferBusinessDomain(expression) {
  const expr = expression.toLowerCase();
  
  // Authentication/Authorization domain
  if (expr.includes('auth') || expr.includes('token') || expr.includes('permission') || expr.includes('credential')) {
    return 'authentication';
  }
  
  // Database/Storage domain  
  if (expr.includes('db') || expr.includes('database') || expr.includes('storage') || expr.includes('save') || expr.includes('persist')) {
    return 'database';
  }
  
  // Network/API domain
  if (expr.includes('fetch') || expr.includes('http') || expr.includes('api') || expr.includes('request') || expr.includes('response')) {
    return 'network';
  }
  
  // UI/Presentation domain
  if (expr.includes('render') || expr.includes('display') || expr.includes('ui') || expr.includes('component') || expr.includes('element')) {
    return 'ui';
  }
  
  // Business Logic domain (default for result/error/data)
  if (expr.includes('result') || expr.includes('error') || expr.includes('data') || expr.includes('output')) {
    return 'business_logic';
  }
  
  // Testing Infrastructure domain
  if (expr.includes('mock') || expr.includes('spy') || expr.includes('stub') || expr.includes('console')) {
    return 'test_infrastructure';
  }
  
  return 'unknown';
}

function categorizeByBusinessDomain(testSubjects) {
  const domains = testSubjects.map(subject => subject.domain).filter(domain => domain !== 'unknown');
  const uniqueDomains = [...new Set(domains)];
  
  // Filter out legitimate combinations
  const legitimateCombinations = [
    ['business_logic', 'test_infrastructure'], // Testing business logic with mocks is normal
    ['network', 'business_logic'], // API calls with result validation is normal
  ];
  
  for (const combo of legitimateCombinations) {
    if (uniqueDomains.length === combo.length && combo.every(domain => uniqueDomains.includes(domain))) {
      return []; // This is a legitimate combination
    }
  }
  
  return uniqueDomains.length >= 3 ? uniqueDomains : [];
}

function identifyExternalServices(testSubjects) {
  const services = [];
  
  testSubjects.forEach(subject => {
    const expr = subject.fullExpression.toLowerCase();
    
    if (expr.includes('discord') && !services.includes('Discord API')) {
      services.push('Discord API');
    }
    if (expr.includes('google') && !services.includes('Google Sheets')) {
      services.push('Google Sheets');
    }
    if (expr.includes('database') && !services.includes('Database')) {
      services.push('Database');
    }
    if (expr.includes('redis') && !services.includes('Redis')) {
      services.push('Redis');
    }
    if (expr.includes('smtp') || expr.includes('email') && !services.includes('Email Service')) {
      services.push('Email Service');
    }
  });
  
  return services;
}

function analyzeConcernTypes(expects) {
  const concerns = [];
  
  const hasDataValidation = expects.some(e => e.full.includes('.data') || e.full.includes('.result') || e.full.includes('.output'));
  const hasErrorHandling = expects.some(e => e.full.includes('.error') || e.full.includes('throw') || e.full.includes('catch'));
  const hasMockValidation = expects.some(e => e.full.includes('toHaveBeenCalled') || e.full.includes('mock'));
  const hasStateValidation = expects.some(e => e.full.includes('.state') || e.full.includes('.status') || e.full.includes('.flag'));
  const hasPerformanceChecks = expects.some(e => e.full.includes('time') || e.full.includes('duration') || e.full.includes('performance'));
  const hasSecurityChecks = expects.some(e => e.full.includes('auth') || e.full.includes('permission') || e.full.includes('credential'));
  
  if (hasDataValidation) concerns.push('data_validation');
  if (hasErrorHandling) concerns.push('error_handling');
  if (hasMockValidation) concerns.push('mock_validation');
  if (hasStateValidation) concerns.push('state_validation');
  if (hasPerformanceChecks) concerns.push('performance');
  if (hasSecurityChecks) concerns.push('security');
  
  return concerns;
}

function generateReport(allIssues) {
  console.log('🔍 ADVANCED FREE RIDE PATTERN DETECTION');
  console.log('=======================================');
  
  if (allIssues.length === 0) {
    console.log('✅ No Free Ride patterns detected!');
    return;
  }
  
  console.log(`⚠️  Found ${allIssues.length} potential Free Ride pattern(s):\n`);
  
  for (const issue of allIssues) {
    const relativePath = path.relative(process.cwd(), issue.file);
    console.log(`📁 ${relativePath}`);
    console.log(`   Test: ${issue.test.substring(0, 80)}...`);
    console.log(`   Lines: ${issue.startLine}-${issue.endLine}`);
    console.log(`   Assertions: ${issue.expectCount}`);
    
    for (const pattern of issue.patterns) {
      const icon = pattern.severity === 'high' ? '🚨' : '⚠️';
      console.log(`   ${icon} ${pattern.description}`);
      if (pattern.details) {
        console.log(`       Details: ${pattern.details}`);
      }
    }
    
    console.log('   Expectations:');
    for (const expect of issue.expects) {
      console.log(`     Line ${expect.line}: ${expect.full}`);
    }
    console.log('');
  }
  
  const highSeverity = allIssues.filter(i => i.patterns.some(p => p.severity === 'high'));
  if (highSeverity.length > 0) {
    console.log(`🚨 ${highSeverity.length} high-severity Free Ride pattern(s) detected!`);
    process.exit(1);
  } else {
    console.log('⚠️  Medium-severity patterns detected. Consider refactoring for better test focus.');
  }
}

// Main execution
const testDir = path.join(process.cwd(), 'src', '__tests__');

if (!fs.existsSync(testDir)) {
  console.log('❌ Test directory not found:', testDir);
  process.exit(1);
}

const testFiles = findTestFiles(testDir);
let allIssues = [];

for (const file of testFiles) {
  const issues = analyzeTestFile(file);
  allIssues = allIssues.concat(issues);
}

generateReport(allIssues);