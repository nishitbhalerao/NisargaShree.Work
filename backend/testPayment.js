import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

async function testCheckoutSummary() {
  try {
    console.log('Testing checkout summary API...');
    
    const items = [
      { _id: 'roti', name: 'Poli (Fresh Roti)', price: 12, quantity: 2 },
      { _id: 'puranPoli', name: 'Puran Poli', price: 40, quantity: 1 }
    ];
    
    const response = await axios.post(`${API_BASE}/payment/checkout-summary`, { items });
    
    console.log('✅ Checkout Summary Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Checkout Summary Error:', error.response?.data || error.message);
    return null;
  }
}

async function testCreateOrder() {
  try {
    console.log('\nTesting create order API...');
    
    const orderData = {
      items: [
        { _id: 'roti', name: 'Poli (Fresh Roti)', price: 12, quantity: 2 },
        { _id: 'puranPoli', name: 'Puran Poli', price: 40, quantity: 1 }
      ],
      customerInfo: {
        name: 'Test Customer',
        phone: '9999999999',
        address: 'Test Address, Mumbai',
        deliveryInstructions: 'Test delivery'
      },
      orderType: 'delivery'
    };
    
    const response = await axios.post(`${API_BASE}/payment/create-order`, orderData);
    
    console.log('✅ Create Order Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Create Order Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetProducts() {
  try {
    console.log('\nTesting products API...');
    
    const response = await axios.get(`${API_BASE}/products`);
    
    console.log('✅ Products Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Products Error:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('=== NisargaShree Payment API Tests ===\n');
  
  await testGetProducts();
  await testCheckoutSummary();
  await testCreateOrder();
  
  console.log('\n=== Tests Complete ===');
}

runTests();