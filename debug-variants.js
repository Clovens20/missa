const fs = require('fs');

fetch('https://fdoiideysifrcvchtqdn.supabase.co/rest/v1/dropship_products?slug=ilike.%25ensemble-uniforme-mdical%25&select=variants,images', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkb2lpZGV5c2lmcmN2Y2h0cWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjI1NjEsImV4cCI6MjA4NjgzODU2MX0.QqI3ikI5Sl-ECAXlHvAsti-8UZCKEyhreGvwLkYGlwY',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkb2lpZGV5c2lmcmN2Y2h0cWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjI1NjEsImV4cCI6MjA4NjgzODU2MX0.QqI3ikI5Sl-ECAXlHvAsti-8UZCKEyhreGvwLkYGlwY'
  }
})
.then(res => res.json())
.then(data => {
  fs.writeFileSync('debug-variants.json', JSON.stringify(data, null, 2));
  console.log('Done!');
})
.catch(console.error);
