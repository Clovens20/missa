import { getCJProductDetail } from './src/lib/cj-api'

async function run() {
  try {
    const data = await getCJProductDetail('1686674365385023488')
    console.log(JSON.stringify(data.variants, null, 2))
  } catch(e) {
    console.error(e)
  }
}
run()
