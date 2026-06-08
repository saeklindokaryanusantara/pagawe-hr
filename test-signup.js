import { insforge } from './src/lib/insforge.js';

async function testSignup() {
  console.log("Attempting signup...");
  const res = await insforge.auth.signUp({
    email: 'admin@pagawe.com',
    password: 'password123'
  });
  console.log("Result:", res);
}

testSignup();
