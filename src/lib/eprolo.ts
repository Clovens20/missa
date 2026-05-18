import crypto from 'crypto'

const BASE_URL = 'https://openapi.eprolo.com'
const API_KEY = process.env.EPROLO_API_KEY!
const API_SECRET = process.env.EPROLO_API_SECRET!

// Generate MD5 signature
function generateSign(timestamp: string): string {
  const raw = API_KEY + timestamp + API_SECRET
  return crypto
    .createHash('md5')
    .update(raw)
    .digest('hex')
    .toLowerCase() // 32-bit lowercase
}

// Common headers for every request
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'apiKey': API_KEY,
  }
}

// Common params for every request
function getAuthParams() {
  const timestamp = Date.now().toString()
  const sign = generateSign(timestamp)
  return { sign, timestamp }
}

// ─────────────────────────────────────
// GET ALL EPROLO PLATFORM PRODUCTS
// Endpoint: GET /eprolo_product_list.html
// Returns EPROLO catalog products
// ─────────────────────────────────────
export async function getEproloProductList(
  page_index = 0,
  page_size = 20
) {
  const { sign, timestamp } = getAuthParams()
  
  const url = new URL(
    `${BASE_URL}/eprolo_product_list.html`
  )
  url.searchParams.set('sign', sign)
  url.searchParams.set('timestamp', timestamp)
  url.searchParams.set(
    'page_index', 
    String(page_index)
  )
  url.searchParams.set(
    'page_size', 
    String(page_size)
  )

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: getHeaders(),
  })
  return res.json()
}

// ─────────────────────────────────────
// ADD PRODUCT TO MY EPROLO ACCOUNT
// Endpoint: POST /add_product.html
// Must call this BEFORE product_list
// ─────────────────────────────────────
export async function addEproloProduct(
  ids: string[]
) {
  const { sign, timestamp } = getAuthParams()

  const res = await fetch(
    `${BASE_URL}/add_product.html`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        ids, 
        sign, 
        timestamp 
      }),
    }
  )
  return res.json()
}

// ─────────────────────────────────────
// GET MY STORE PRODUCT LIST
// Endpoint: GET /product_list.html
// Returns products added to my account
// ─────────────────────────────────────
export async function getMyEproloProducts(
  page_index = 0,
  page_size = 20
) {
  const { sign, timestamp } = getAuthParams()

  const url = new URL(
    `${BASE_URL}/product_list.html`
  )
  url.searchParams.set('sign', sign)
  url.searchParams.set('timestamp', timestamp)
  url.searchParams.set(
    'page_index', 
    String(page_index)
  )
  url.searchParams.set(
    'page_size', 
    String(page_size)
  )
  url.searchParams.set('status', '1')

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: getHeaders(),
  })
  return res.json()
}

// ─────────────────────────────────────
// GET PRODUCT DETAIL
// Endpoint: GET /getproduct.html
// ─────────────────────────────────────
export async function getEproloProductDetail(
  id: string,
  product_id: string
) {
  const { sign, timestamp } = getAuthParams()

  const url = new URL(
    `${BASE_URL}/getproduct.html`
  )
  url.searchParams.set('sign', sign)
  url.searchParams.set('timestamp', timestamp)
  url.searchParams.set('id', id)
  url.searchParams.set('product_id', product_id)

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: getHeaders(),
  })
  return res.json()
}

// ─────────────────────────────────────
// GET PRODUCT CATEGORIES
// Endpoint: GET /product_type.html
// ─────────────────────────────────────
export async function getEproloCategories() {
  const { sign, timestamp } = getAuthParams()

  const url = new URL(
    `${BASE_URL}/product_type.html`
  )
  url.searchParams.set('sign', sign)
  url.searchParams.set('timestamp', timestamp)

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: getHeaders(),
  })
  return res.json()
}

// ─────────────────────────────────────
// CREATE ORDER ON EPROLO
// Endpoint: POST /add_order.html
// ─────────────────────────────────────
export async function createEproloOrder(
  orderData: {
    order_id: string
    order_number: string
    shipping_name: string
    shipping_phone: string
    shipping_country: string
    shipping_country_code: string
    shipping_address: string
    shipping_province: string
    shipping_province_code: string
    shipping_city: string
    shipping_post_code: string
    shipping_address2?: string
    email?: string
    note?: string
    logistics_id?: number
    orderItemlist: Array<{
      variantsid: string
      quantity: number
    }>
  }
) {
  const { sign, timestamp } = getAuthParams()

  const res = await fetch(
    `${BASE_URL}/add_order.html`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...orderData,
        sign,
        timestamp,
      }),
    }
  )
  return res.json()
}

// ─────────────────────────────────────
// GET ORDER LIST
// Endpoint: GET /order_list.html
// ─────────────────────────────────────
export async function getEproloOrders(
  status = 0,
  page = 1,
  page_size = 20
) {
  const { sign, timestamp } = getAuthParams()

  const url = new URL(
    `${BASE_URL}/order_list.html`
  )
  url.searchParams.set('sign', sign)
  url.searchParams.set('timestamp', timestamp)
  url.searchParams.set('status', String(status))
  url.searchParams.set('page', String(page))
  url.searchParams.set(
    'page_size', 
    String(page_size)
  )

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: getHeaders(),
  })
  return res.json()
}
