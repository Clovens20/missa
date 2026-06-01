const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const token = env.match(/CJ_ACCESS_TOKEN=(.+)/)?.[1]?.trim();
if (!token) { console.error('No token'); process.exit(1); }
fetch('https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=1686674365385023488', { headers: { 'CJ-Access-Token': token } })
  .then(r => r.json())
  .then(data => fs.writeFileSync('cj-product-debug.json', JSON.stringify(data, null, 2)));
