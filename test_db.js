const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.log("No env variables found");
  process.exit(1);
}

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

fetch(url + '/rest/v1/products?select=*', {
  headers: {
    apikey: key,
    Authorization: 'Bearer ' + key
  }
})
.then(r => r.json())
.then(d => {
  if (Array.isArray(d)) {
    console.log(d.length ? d.length + ' products found' : '0 products found');
    if (d.length > 0) {
      console.log('Sample product:', d[0].name);
    }
  } else {
    console.log('Error or unexpected response:', d);
  }
})
.catch(e => console.error(e));
