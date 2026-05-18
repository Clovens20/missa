const fs = require('fs');
const Stripe = require('stripe');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length) acc[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const stripe = Stripe(env.STRIPE_SECRET_KEY);

async function run() {
  try {
    const sessionId = 'cs_live_b1MOya5boHZ5OOl0eB12YN8C7non9Io3MaZXmQKwAnfdZGaNyCSPifokxW';
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Stripe Session Details:');
    console.log('Customer Details:', JSON.stringify(session.customer_details, null, 2));
    console.log('Shipping Details:', JSON.stringify(session.shipping_details, null, 2));
    console.log('Shipping Cost:', session.shipping_cost);
    console.log('Amount Total:', session.amount_total);
  } catch (err) {
    console.error('Error retrieving session:', err);
  }
}

run();
