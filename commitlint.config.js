/**
 * Commitlint configuration for enforcing conventional commits
 * Using @commitlint/config-conventional rules
 * 
 * Conventional Commit Format:
 * <type>[optional scope]: <description>
 * 
 * [optional body]
 * 
 * [optional footer(s)]
 */

export default {
  extends: ['@commitlint/config-conventional'],
  
  rules: {
    // Enforce conventional commit types
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting, etc)
        'refactor', // Code refactoring
        'test',     // Adding or modifying tests
        'chore',    // Maintenance tasks
        'perf',     // Performance improvements
        'ci',       // CI/CD changes
        'build',    // Build system changes
        'revert',   // Reverting previous commits
      ],
    ],
    
    // Subject/description rules
    'subject-max-length': [2, 'always', 72],
    'subject-min-length': [2, 'always', 10],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    
    // Type rules
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    
    // Scope rules (optional but enforce format if used)
    'scope-case': [2, 'always', 'lower-case'],
    
    // Body and footer rules
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],
    
    // Header rules
    'header-max-length': [2, 'always', 100],
    'header-min-length': [2, 'always', 15],
  },
};