const http = require('http');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5001/api';

// Test suite
const tests = {
  passed: 0,
  failed: 0,
  results: []
};

function log(message, type = 'info') {
  const colors = {
    success: '\x1b[32m',
    error: '\x1b[31m',
    info: '\x1b[36m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    await fn();
    tests.passed++;
    tests.results.push({ name, status: 'PASS' });
    log(`✓ ${name}`, 'success');
  } catch (error) {
    tests.failed++;
    tests.results.push({ name, status: 'FAIL', error: error.message });
    log(`✗ ${name}: ${error.message}`, 'error');
  }
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function runTests() {
  log('\n🧪 Starting System Tests...\n', 'info');

  // Test 1: Health Check
  await test('Health Check Endpoint', async () => {
    const response = await httpGet(`${API_URL}/health`);
    if (response.status !== 200) throw new Error('Health check failed');
    const data = JSON.parse(response.data);
    if (data.status !== 'ok') throw new Error('Health status not ok');
  });

  // Test 2: Auth Middleware
  await test('Auth Middleware (Unauthorized)', async () => {
    const response = await httpGet(`${API_URL}/jobs`);
    if (response.status !== 401) {
      throw new Error('Auth middleware not working - should return 401');
    }
  });

  // Test 3: Check frontend API base URL
  await test('Frontend API Configuration', async () => {
    const apiFile = fs.readFileSync('/Users/sivanagireddy/Harvestors/frontend/src/api.js', 'utf8');
    if (!apiFile.includes('${API_URL}/api')) {
      throw new Error('API baseURL not properly configured');
    }
  });

  // Test 4: Check Jobs route structure
  await test('Jobs Route Structure', async () => {
    const jobsFile = fs.readFileSync('/Users/sivanagireddy/Harvestors/backend/routes/jobs.js', 'utf8');
    
    // Check for required routes
    const requiredRoutes = ['router.get', 'router.post', 'router.put', 'router.delete'];
    for (const route of requiredRoutes) {
      if (!jobsFile.includes(route)) {
        throw new Error(`Missing ${route} in jobs.js`);
      }
    }
  });

  // Test 5: Check for proper imports in updated pages
  await test('Jobs Page Imports', async () => {
    const jobsPage = fs.readFileSync('/Users/sivanagireddy/Harvestors/frontend/src/pages/Jobs.js', 'utf8');
    
    const requiredImports = ['FaTractor', 'FaEdit', 'FaTrash', 'FaCalendarAlt', 'FaClock'];
    for (const imp of requiredImports) {
      if (!jobsPage.includes(imp)) {
        throw new Error(`Missing import ${imp}`);
      }
    }
  });

  // Test 6: Check Payments Page Icons
  await test('Payments Page Imports', async () => {
    const paymentsPage = fs.readFileSync('/Users/sivanagireddy/Harvestors/frontend/src/pages/Payments.js', 'utf8');
    
    if (!paymentsPage.includes('FaEdit') || !paymentsPage.includes('FaTrash')) {
      throw new Error('Missing action button imports');
    }
  });

  // Test 7: Check Farmers Page Styling
  await test('Farmers Page Dark Theme', async () => {
    const farmersPage = fs.readFileSync('/Users/sivanagireddy/Harvestors/frontend/src/pages/Farmers.js', 'utf8');
    
    if (!farmersPage.includes('rgba(30, 41, 59, 0.6)')) {
      throw new Error('Dark theme styling not applied');
    }
  });

  // Test 8: Check for Filter Status in Jobs
  await test('Jobs Page Status Filter', async () => {
    const jobsPage = fs.readFileSync('/Users/sivanagireddy/Harvestors/frontend/src/pages/Jobs.js', 'utf8');
    
    if (!jobsPage.includes('filterStatus')) {
      throw new Error('Status filter not implemented');
    }
  });

  // Test 9: Check Export Functionality
  await test('Export Utils Exists', async () => {
    const exportUtils = fs.readFileSync('/Users/sivanagireddy/Harvestors/frontend/src/utils/exportUtils.js', 'utf8');
    
    if (!exportUtils.includes('exportToCSV') || !exportUtils.includes('formatDataForExport')) {
      throw new Error('Export functions not properly defined');
    }
  });

  // Test 10: Check Backend Server Config
  await test('Backend Server Configuration', async () => {
    const serverFile = fs.readFileSync('/Users/sivanagireddy/Harvestors/backend/server.js', 'utf8');
    
    if (!serverFile.includes('5001') && !serverFile.includes('process.env.PORT')) {
      throw new Error('Port configuration issue');
    }
  });

  // Test 11: Check Supabase Config
  await test('Supabase Configuration', async () => {
    const supabaseConfig = fs.readFileSync('/Users/sivanagireddy/Harvestors/backend/config/supabase.js', 'utf8');
    
    if (!supabaseConfig.includes('createClient')) {
      throw new Error('Supabase client not properly configured');
    }
  });

  // Test 12: Check for Removed Console Logs
  await test('No Debug Console Logs in Jobs', async () => {
    const jobsRoute = fs.readFileSync('/Users/sivanagireddy/Harvestors/backend/routes/jobs.js', 'utf8');
    
    // Check if debug console logs are removed
    if (jobsRoute.includes('console.log') && jobsRoute.includes('UPDATE JOB')) {
      throw new Error('Debug console logs still present');
    }
  });

  // Test 13: Check Action Buttons Structure
  await test('Action Buttons in Jobs Page', async () => {
    const jobsPage = fs.readFileSync('/Users/sivanagireddy/Harvestors/frontend/src/pages/Jobs.js', 'utf8');
    
    if (!jobsPage.includes('onMouseEnter') || !jobsPage.includes('borderRadius: \'8px\'')) {
      throw new Error('Enhanced action buttons not properly implemented');
    }
  });

  // Test 14: Check Row Hover Effects
  await test('Table Row Hover Effects', async () => {
    const jobsPage = fs.readFileSync('/Users/sivanagireddy/Harvestors/frontend/src/pages/Jobs.js', 'utf8');
    
    if (!jobsPage.includes('rgba(102, 126, 234, 0.1)')) {
      throw new Error('Row hover effects not implemented');
    }
  });

  // Test 15: Check Currency Formatting
  await test('Currency Formatting (No Rupee Symbol)', async () => {
    const jobsPage = fs.readFileSync('/Users/sivanagireddy/Harvestors/frontend/src/pages/Jobs.js', 'utf8');
    
    // Check that rupee symbols are removed from table cells
    const lines = jobsPage.split('\n');
    const tableSection = lines.slice(490, 510).join('\n');
    
    // Count rupee symbols in rate/amount display
    const rupeeCount = (tableSection.match(/₹/g) || []).length;
    if (rupeeCount > 0) {
      throw new Error('Rupee symbols still present in amount displays');
    }
  });

  // Print Summary
  log('\n📊 Test Summary:', 'info');
  log(`Total Tests: ${tests.passed + tests.failed}`, 'info');
  log(`Passed: ${tests.passed}`, 'success');
  log(`Failed: ${tests.failed}`, tests.failed > 0 ? 'error' : 'success');
  
  if (tests.failed > 0) {
    log('\n❌ Failed Tests:', 'error');
    tests.results.filter(r => r.status === 'FAIL').forEach(r => {
      log(`  • ${r.name}: ${r.error}`, 'error');
    });
  } else {
    log('\n✅ All tests passed!', 'success');
  }
  
  process.exit(tests.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  log(`Fatal error: ${err.message}`, 'error');
  process.exit(1);
});
