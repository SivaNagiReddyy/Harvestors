const axios = require('axios');

async function testDashboard() {
  try {
    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, got token');
    
    // Now test the dashboard with the token
    console.log('\n2. Fetching dashboard stats...');
    const dashboardResponse = await axios.get('http://localhost:5001/api/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n3. Dashboard Response:');
    console.log('Counts:', dashboardResponse.data.counts);
    console.log('Financials:', dashboardResponse.data.financials);
    console.log('\n✅ Dashboard API is working!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDashboard();
