const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

fetch(url + '/rest/v1/products?select=*,categories(name)&order=created_at.desc', {
  headers: {
    apikey: key,
    Authorization: 'Bearer ' + key
  }
})
.then(r => r.json())
.then(d => {
  if (d.error) {
    console.log('Error:', d);
  } else if (Array.isArray(d)) {
    console.log(d.length + ' products found');
    if (d.length > 0) console.log(d[0]);
  } else {
    console.log('Other:', d);
  }
})
.catch(e => console.error(e));
