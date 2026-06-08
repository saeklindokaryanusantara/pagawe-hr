import { createClient } from '@insforge/sdk';

const client = createClient('https://78k5bxvy.ap-southeast.insforge.app', 'ik_ac9e72d7ca7690b7beb9f81376aadf62');

async function test() {
  console.log("Checking database...");
  try {
    const res = await client.database.from('clients').select('*', { count: 'exact', head: true });
    console.log("Result:", res);
    
    const health = await fetch('https://78k5bxvy.ap-southeast.insforge.app/rest/v1/', { method: 'HEAD' });
    console.log("Health check status:", health.status);
  } catch (err) {
    console.error("Fetch Error:", err.message);
  }
}

test();
