/**
 * Direct test script to debug the real Google Sheets sync issue
 * Run with: node debug-real-sync.js
 */

import { createSheetsClient } from './src/application_commands/google-sheets/admin-sync-users-to-sheets/sheets-operations.js';

const testCredentials = {
  type: 'service_account',
  project_id: process.env.GOOGLE_SHEETS_PROJECT_ID || 'missing',
  private_key_id: process.env.GOOGLE_SHEETS_PRIVATE_KEY_ID || 'missing',
  private_key: (process.env.GOOGLE_SHEETS_PRIVATE_KEY || 'missing').replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL || 'missing',
  client_id: process.env.GOOGLE_SHEETS_CLIENT_ID || 'missing',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.GOOGLE_SHEETS_CLIENT_X509_CERT_URL || '',
  universe_domain: 'googleapis.com',
};

const sheetId = process.env.GOOGLE_SHEET_ID;

async function testRealAPI() {
  console.log('🔧 Testing real Google Sheets API...\n');
  
  if (!sheetId) {
    console.error('❌ GOOGLE_SHEET_ID not set');
    return;
  }
  
  if (!testCredentials.project_id || testCredentials.project_id === 'missing') {
    console.error('❌ Google Sheets credentials not properly configured');
    console.log('Required env vars: GOOGLE_SHEETS_PROJECT_ID, GOOGLE_SHEETS_PRIVATE_KEY, GOOGLE_SHEETS_CLIENT_EMAIL, etc.');
    return;
  }
  
  console.log(`📊 Sheet ID: ${sheetId}`);
  console.log(`📧 Service Account: ${testCredentials.client_email}\n`);
  
  try {
    // Test creating the client
    console.log('1. Creating Google Sheets client...');
    const clientResult = createSheetsClient(testCredentials);
    
    if (!clientResult.success) {
      console.error('❌ Failed to create client:', clientResult.error);
      return;
    }
    
    console.log('✅ Client created successfully\n');
    
    // Test reading from the sheet
    console.log('2. Testing read from Google Sheets...');
    const readResult = await clientResult.client.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:A',
    });
    
    console.log('✅ Read successful');
    console.log('Current data in sheet:', readResult.data.values || 'No data');
    console.log('');
    
    // Test writing to the sheet
    console.log('3. Testing write to Google Sheets...');
    const testData = [
      ['test-user-' + Date.now(), 'Test User', 'testuser', new Date().toISOString(), 'false', 'true', new Date().toISOString()]
    ];
    
    const writeResult = await clientResult.client.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [{
          range: 'Sheet1!A:G',
          values: testData,
        }],
      },
    });
    
    console.log('✅ Write successful!');
    console.log('Updated rows:', writeResult.data.totalUpdatedRows);
    console.log('Updated cells:', writeResult.data.totalUpdatedCells);
    console.log('Test data written:', testData[0]);
    
  } catch (error) {
    console.error('❌ Error during API test:');
    console.error(error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', await error.response.text().catch(() => 'Could not read response'));
    }
  }
}

testRealAPI();