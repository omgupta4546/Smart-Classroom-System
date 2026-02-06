const axios = require('axios');

async function testRegister() {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Test user',
            email: 'test@example.com',
            password: 'password123',
            role: 'student'
        });
        console.log('Registration Success:', res.data);
    } catch (err) {
        if (err.response) {
            console.error('Registration Failed (Status 500):', err.response.data);
        } else {
            console.error('Registration Failed (Network/Other):', err.message);
        }
    }
}

testRegister();
