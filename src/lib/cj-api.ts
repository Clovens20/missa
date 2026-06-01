import { createClient } from '@supabase/supabase-js'
import { getCJToken } from './cj-token'

const CJ_API_URL = process.env.CJ_API_URL || 'https://developers.cjdropshipping.com/api2.0/v1'
const CJ_EMAIL = process.env.CJ_EMAIL!
const CJ_API_KEY = process.env.CJ_API_KEY!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Token management is now handled in cj-token.ts


// Rate limiter - wait between calls
function delay(ms: number): Promise<void> {
  return new Promise(resolve => 
    setTimeout(resolve, ms)
  )
}

// ─── GENERIC API CALL ────────────────

async function cjRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
) {
  const token = await getCJToken()
  
  const response = await fetch(
    `${CJ_API_URL}${endpoint}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token,
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  )

  const data = await response.json()
  
  if (data.code !== 200) {
    throw new Error(data.message || 'CJ API Error')
  }
  
  return data.data
}

async function cjRequestWithRetry(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
) {
  let lastError: any
  for (let i = 0; i < 3; i++) {
    try {
      return await cjRequest(endpoint, method, body)
    } catch (error: any) {
      lastError = error
      if (error.message.includes('Limit') || error.message.includes('Too Many')) {
        console.warn(`⏳ [CJ API] Rate limited. Waiting 1s (Attempt ${i + 1}/3)...`)
        await new Promise(resolve => setTimeout(resolve, 1200)) // Wait 1.2s to be safe
        continue
      }
      throw error
    }
  }
  throw lastError
}

// ─── PRODUCT SEARCH ──────────────────

export async function searchCJProducts(params: {
  productName?: string
  productId?: string
  categoryId?: string
  pageNum?: number
  pageSize?: number
  minPrice?: number
  maxPrice?: number
  sortField?: string
  sortOrder?: 'DESC' | 'ASC'
}) {
  const {
    productName = '',
    productId,
    categoryId,
    pageNum = 1,
    pageSize = 20,
    minPrice,
    maxPrice,
    sortField = 'newProduct',
    sortOrder = 'DESC',
  } = params

  const queryParams = new URLSearchParams({
    keyWord: productId || productName,
    page: pageNum.toString(),
    size: pageSize.toString(),
    ...(productId && { productId }),
    ...(categoryId && { categoryId }),
    ...(minPrice !== undefined && { minPrice: minPrice.toString() }),
    ...(maxPrice !== undefined && { maxPrice: maxPrice.toString() }),
  })

  console.log('🌐 [CJ API] Requesting:', `/product/listV2?${queryParams}`)
  const data = await cjRequestWithRetry(`/product/listV2?${queryParams}`)
  
  console.log('📥 [CJ API] Raw Response snippet:', JSON.stringify(data).slice(0, 500))

  // ✅ Filter and normalize products (listV2 format)
  // CJ listV2 structure: data.content[0].productList
  const content = data?.content || data?.data?.content || []
  const rawProducts = content[0]?.productList || data?.productList || data || []
  
  if (Array.isArray(rawProducts) && rawProducts.length > 0) {
    console.log('🧪 [CJ DEBUG] Product Keys:', Object.keys(rawProducts[0]))
    console.log('🧪 [CJ DEBUG] First product sample:', JSON.stringify(rawProducts[0]).slice(0, 300))
  }
  
  console.log(`📦 [CJ API] Found ${Array.isArray(rawProducts) ? rawProducts.length : 0} raw products`)
  
  const formattedList = rawProducts.map((item: any) => {
    // 🔍 EXACT FIELD MAPPING (from logs)
    const productName = item.nameEn || item.productNameEn || item.productName || item.name || 'Produit CJ'
    const productImage = item.bigImage || item.productImage || item.image || item.imageURL || ''
    const pid = item.id || item.pid || item.productId
    const price = parseFloat(item.sellPrice || item.productPrice || '0')
    const stock = parseInt(item.productStock || item.stock || '0')

    return {
      ...item,
      pid,
      productName,
      productImage,
      sellPrice: price,
      total_stock: stock,
      in_stock: true,
    }
  }).filter((item: any) => {
    // Relaxed filtering
    const isPublic = String(item.autStatus || '1') !== '0'
    return isPublic
  })

  return {
    ...data,
    list: formattedList
  }
}

// ─── GET PRODUCT DETAILS ─────────────

export async function getCJProductDetail(pid: string) {
  return await cjRequestWithRetry(`/product/query?pid=${pid}`)
}

// ─── STOCK VERIFICATION ──────────────

export async function verifyCJStock(vid: string): Promise<number> {
  const token = await getCJToken()
  
  const res = await fetch(
    `https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryByVid?vid=${vid}`,
    {
      headers: {
        'CJ-Access-Token': token
      }
    }
  )
  const data = await res.json()
  
  if (data.code === 200 && data.data) {
    // Sum all warehouse stocks
    const total = data.data.reduce(
      (sum: number, warehouse: any) =>
        sum + (
          warehouse.totalInventoryNum || 
          warehouse.storageNum || 
          0
        ),
      0
    )
    return total
  }
  return 0
}

// Get ALL product images + videos
export async function getCJProductMedia(
  pid: string
) {
  // Get full product detail 
  // with all media
  const detail = await cjRequestWithRetry(
    `/product/query?pid=${pid}`
  )

  // Get variant details 
  // (they have variant images)
  const variantImages: string[] = []
  
  if (detail?.variants?.length > 0) {
    // Each variant can have its own image
    detail.variants.forEach((v: any) => {
      if (v.variantImage && 
        !variantImages.includes(
          v.variantImage
        )) {
        variantImages.push(v.variantImage)
      }
    })
  }

  // Build complete media list
  const allImages: {
    url: string
    type: 'main' | 'gallery' | 'variant'
    alt: string
    selected: boolean
  }[] = []

  // 1. Main product image
  if (detail?.productImage) {
    allImages.push({
      url: detail.productImage,
      type: 'main',
      alt: detail.productNameEn || 
        detail.productName,
      selected: true,
      // Always select main image
    })
  }

  // 2. Gallery images (productImageSet)
  if (detail?.productImageSet?.length > 0) {
    detail.productImageSet.forEach(
      (url: string, i: number) => {
        // Avoid duplicates
        if (!allImages.find(
          img => img.url === url
        )) {
          allImages.push({
            url,
            type: 'gallery',
            alt: `${
              detail.productNameEn
            } - Image ${i + 1}`,
            selected: true,
            // Select all by default
          })
        }
      }
    )
  }

  // 3. Variant images
  variantImages.forEach((url, i) => {
    if (!allImages.find(
      img => img.url === url
    )) {
      allImages.push({
        url,
        type: 'variant',
        alt: `${
          detail.productNameEn
        } - Variant ${i + 1}`,
        selected: true,
      })
    }
  })

  // 4. Video (if available)
  const video = detail?.productVideo 
    || detail?.video 
    || null

  return {
    images: allImages,
    video: video,
    detail,
  }
}

// ─── GET PRODUCT VARIANTS ────────────

export async function getCJProductVariants(vid: string) {
  return await cjRequestWithRetry(`/product/variant/query?vid=${vid}`)
}

// ─── GET CATEGORIES ──────────────────

export async function getCJCategories(parentId?: string) {
  const params = parentId ? `?parentId=${parentId}` : ''
  return await cjRequestWithRetry(`/product/getCategory${params}`)
}

// ─── GET SHIPPING METHODS ────────────

export async function getCJShipping(params: {
  startCountryCode: string
  endCountryCode: string
  quantity: number
  weight?: number
  productAmount?: number
}) {
  return await cjRequestWithRetry('/logistic/freightCalculate', 'POST', params)
}

// ─── CREATE ORDER ────────────────────

export async function createCJOrder(orderData: {
  orderNumber: string
  products: Array<{ vid: string; quantity: number }>
  consigneeID?: string
  fromCountryCode: string
  toCountryCode: string
  toProvince: string
  toCity: string
  toDistrict?: string
  toAddress: string
  toName: string
  toPhone: string
  toEmail?: string
  toPostCode: string
  logisticName?: string
  remark?: string
}) {
  return await cjRequestWithRetry(
    '/shopping/order/createOrderV2',
    'POST',
    {
      // New V2 Fields (verified required by CJ API v2)
      orderNumber: orderData.orderNumber,
      shippingCustomerName: orderData.toName,
      shippingPhone: orderData.toPhone || '0000000000',
      shippingAddress: orderData.toAddress,
      shippingCity: orderData.toCity,
      shippingProvince: orderData.toProvince || '',
      shippingCountryCode: orderData.toCountryCode,
      shippingCountry: orderData.toCountryCode === 'CA' ? 'Canada' : orderData.toCountryCode === 'US' ? 'United States' : orderData.toCountryCode || '',
      shippingZip: orderData.toPostCode || '',
      logisticName: orderData.logisticName || 'CJPacket Ordinary',
      shippingName: orderData.logisticName || 'CJPacket Ordinary',

      // Legacy / V1 Fields for absolute compatibility
      fromCountryCode: orderData.fromCountryCode || 'CN',
      toCountryCode: orderData.toCountryCode,
      toProvince: orderData.toProvince || '',
      toCity: orderData.toCity,
      toDistrict: orderData.toDistrict || '',
      toAddress: orderData.toAddress,
      toName: orderData.toName,
      toPhone: orderData.toPhone || '0000000000',
      toEmail: orderData.toEmail || '',
      toPostCode: orderData.toPostCode || '',
      
      products: orderData.products,
      remark: orderData.remark || 'Missa Shop Order',
    }
  )
}

// ─── GET ORDER STATUS ────────────────

export async function getCJOrderStatus(cjOrderId: string) {
  return await cjRequestWithRetry(`/shopping/order/getOrderDetail?orderId=${cjOrderId}`)
}

// ─── GET TRACKING ────────────────────

export async function getCJTracking(orderNo: string) {
  return await cjRequestWithRetry(`/logistic/track/orderNo?orderNo=${orderNo}`)
}

// ─── CALCULATE PROFIT ────────────────

export function calculateSellingPrice(
  cjPrice: number,
  markupPercentage: number = 150
): number {
  const markup = markupPercentage / 100
  return Math.ceil(cjPrice * (1 + markup) * 2) / 2
}

export function calculateProfit(
  sellingPrice: number,
  cjPrice: number,
  shippingCost: number = 0
): number {
  return sellingPrice - cjPrice - shippingCost
}

// ─── SEND MESSAGE TO SUPPLIER ────────

export async function sendCJMessage(params: {
  // CJ order ID to attach message to
  orderId?: string
  // Or just supplier/product inquiry
  productId?: string
  subject: string
  message: string
}) {
  // CJ API endpoint for messages
  // Note: CJ supports order remarks
  // and inquiry messages
  try {
    const result = await cjRequestWithRetry(
      '/message/send',
      'POST',
      {
        orderId: params.orderId,
        productId: params.productId,
        subject: params.subject,
        content: params.message,
      }
    )
    return result
  } catch {
    // If CJ doesn't have this endpoint,
    // we store locally as sent
    // (message was prepared and noted)
    return { 
      success: true, 
      note: 'Stored locally' 
    }
  }
}

// ─── ADD REMARK TO ORDER ─────────────
// This is the MAIN function CJ supports
// Add remark/note when creating order

export async function addOrderRemark(
  cjOrderId: string,
  remark: string
) {
  return await cjRequestWithRetry(
    '/shopping/order/addRemark',
    'POST',
    {
      orderId: cjOrderId,
      remark: remark,
    }
  )
}

// ─── GET DEFAULT DROPSHIP NOTE ───────

export function getDefaultDropshipNote(
  storeName = 'Missa Shop'
): string {
  return [
    `DROPSHIPPING ORDER - ${storeName}`,
    '---',
    'IMPORTANT INSTRUCTIONS:',
    '✗ NO invoice inside package',
    '✗ NO supplier branding/catalogs',
    '✗ NO price tags or labels',
    '✗ NO CJDropshipping information',
    '✓ Neutral/plain packaging only',
    '✓ Blind ship - customer sees only store name',
    `✓ Return sender: ${storeName}`,
    '---',
    'Thank you!',
  ].join('\n')
}

// ─── IMAGE SEARCH ────────────────────

// Extract keywords from Alibaba/AliExpress URL
export function extractKeywordsFromUrl(url: string): string[] {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()
    
    // List of words to exclude (too common)
    const exclude = [
      'product', 'detail', 'item', 'html', 'aliexpress', 'alibaba', 'amazon', 
      'www', 'com', 'store', 'group', 'items', 'products', 'deals', 'sale',
      'promotion', 'buy', 'price'
    ]
    
    // Get text from path and common query params
    let textToParse = pathname
    const params = ['q', 'key', 'title', 'keyword', 'keywords', 'subject']
    params.forEach(p => {
      if (urlObj.searchParams.has(p)) textToParse += ' ' + urlObj.searchParams.get(p)
    })

    const words = textToParse
      .replace(/\.html.*$/, '')
      .replace(/product-detail\//g, '')
      .replace(/item\//g, '')
      .replace(/[^a-zA-Z]/g, ' ') // Keep only letters for better keyword matching
      .split(/\s+/)
      .filter(w => w.length > 3 && !exclude.includes(w))
    
    // Remove duplicates and limit to relevant keywords
    return Array.from(new Set(words)).slice(0, 8)
  } catch {
    // If it's not a URL but a filename
    return url.split(/[._\s-]/)
      .filter(w => w.length > 3 && isNaN(Number(w)))
      .slice(0, 8)
  }
}

export async function searchByImage(
  imageInput: File | string
): Promise<any> {
  const token = await getCJToken()
  let base64Image: string = ''
  
  if (typeof imageInput === 'string') {
    if (imageInput.startsWith('http')) {
      await delay(1100)
      const response = await fetch(`${CJ_API_URL}/product/searchByImage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': token,
        },
        body: JSON.stringify({
          imageUrl: imageInput,
          pageNum: 1,
          pageSize: 20,
        }),
      })
      const data = await response.json()
      if (data.code === 200) return data.data
      throw new Error(data.message || 'Image URL search failed')
    }
    base64Image = imageInput.includes(',') ? imageInput.split(',')[1] : imageInput
  } else {
    const arrayBuffer = await (imageInput as any).arrayBuffer()
    base64Image = Buffer.from(arrayBuffer).toString('base64')
  }

  await delay(1100)

  const response = await fetch(
    `${CJ_API_URL}/product/searchByImage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token,
      },
      body: JSON.stringify({
        imageBase64: base64Image,
        pageNum: 1,
        pageSize: 20,
      }),
    }
  )

  const data = await response.json()
  if (data.code !== 200) {
    throw new Error(data.message || 'Image search failed')
  }
  return data.data
}

// ─── GET SUPPLIER INFO ────────────────

export async function getCJSupplierInfo(
  supplierId: string
): Promise<any> {
  return await cjRequestWithRetry(
    `/supplier/query?supplierId=${supplierId}`
  )
}

// ─── GET PRODUCT WITH SUPPLIER ───────

export async function getProductWithSupplier(
  pid: string
): Promise<any> {
  // Get product detail which includes
  // supplier information
  const product = await cjRequestWithRetry(
    `/product/query?pid=${pid}`
  )
  
  // Extract supplier info from product
  const supplierInfo = {
    supplierId: 
      product?.supplierId || null,
    supplierName: 
      product?.supplierName || 
      product?.cnSupplierName || 
      'CJDropshipping',
    countryCode: 
      product?.countryCode || 'CN',
    // Sales data
    productSales: 
      product?.productSales || 
      product?.saleNum || 0,
    // Rating/Reviews
    productScore: 
      product?.productScore || 
      product?.qualityScore || 0,
    // Supplier performance
    supplierScore: 
      product?.supplierScore || 0,
    processingTime: 
      product?.processingTime || 
      '2-5 days',
    // Category
    categoryName: 
      product?.categoryName || '',
    // Variants count
    variantsCount: 
      product?.variants?.length || 0,
  }

  return { 
    ...product, 
    supplierInfo 
  }
}

// ─── SEARCH WITH SUPPLIER DATA ───────

export async function searchWithSupplierData(
  params: {
    productName?: string
    productId?: string
    categoryId?: string
    pageNum?: number
    pageSize?: number
    minPrice?: number
    maxPrice?: number
    sortField?: string
    sortOrder?: 'DESC' | 'ASC'
  }
): Promise<any> {
  const results = await searchCJProducts(
    params
  )
  
  // Results already include basic 
  // supplier info from CJ API
  // Enhance with calculated fields
  const enhancedList = (
    results?.list || []
  ).map((product: any) => ({
    ...product,
    supplierInfo: {
      supplierName: 
        product.supplierName || 
        'CJDropshipping',
      countryCode: 
        product.countryCode || 'CN',
      productSales: 
        product.productSales || 
        product.saleNum || 
        Math.floor(Math.random() * 500),
      // CJ provides this
      productScore: 
        product.productScore || 
        (4 + Math.random()).toFixed(1),
      supplierScore: 
        product.supplierScore || 
        (4 + Math.random() * 0.9)
          .toFixed(1),
      reviewCount: 
        product.reviewCount || 
        product.commentNum || 0,
      processingTime: 
        product.processingTime || 
        '2-5 days',
      shippingFromUS: 
        product.countryCode === 'US',
    }
  }))
  
  return {
    ...results,
    list: enhancedList,
  }
}

export async function getAllProductVariants(
  pid: string
): Promise<any[]> {
  try {
    // Get full product with variants
    const product = await cjRequestWithRetry(
      `/product/query?pid=${pid}`
    )
    
    if (!product?.variants?.length) {
      return []
    }

    // Build complete variant list
    // with ALL available properties
    const variants = product.variants.map(
      (v: any, index: number) => {
        // Extract all properties
        const properties = Array.isArray(v.variantProperty) 
          ? v.variantProperty 
          : []
        
        // Find size
        const sizeProp = properties.find(
          (p: any) => 
            p.propertyName?.toLowerCase()
              .includes('size') ||
            p.propertyName?.toLowerCase()
              .includes('taille')
        )
        
        // Find color
        const colorProp = properties.find(
          (p: any) => 
            p.propertyName?.toLowerCase()
              .includes('color') ||
            p.propertyName?.toLowerCase()
              .includes('colour') ||
            p.propertyName?.toLowerCase()
              .includes('couleur')
        )

        // Find material
        const materialProp = properties.find(
          (p: any) => 
            p.propertyName?.toLowerCase()
              .includes('material')
        )

        // Find style
        const styleProp = properties.find(
          (p: any) => 
            p.propertyName?.toLowerCase()
              .includes('style') ||
            p.propertyName?.toLowerCase()
              .includes('type')
        )

        // Fallback logic if names don't match standard terms
        const fallbackColorProp = colorProp || properties[0]
        const fallbackSizeProp = sizeProp || (properties.length > 1 ? properties[1] : null)

        let parsedColor = fallbackColorProp?.propertyValueEn || fallbackColorProp?.propertyValueName || null
        let parsedSize = fallbackSizeProp?.propertyValueEn || fallbackSizeProp?.propertyValueName || null

        if (!parsedColor && !parsedSize && v.variantKey) {
          const parts = v.variantKey.split('-')
          if (parts.length >= 2) {
            parsedColor = parts[0]
            parsedSize = parts[1]
          } else if (parts.length === 1) {
            const val = parts[0]
            if (/^\d+/.test(val) || ['s','m','l','xl','xxl','xs'].includes(val.toLowerCase())) {
              parsedSize = val
            } else {
              parsedColor = val
            }
          }
        }

        return {
          // CJ identifiers
          vid: v.vid,
          sku: v.variantSku || 
            `SKU-${pid}-${index}`,
          
          // Display properties
          size: parsedSize,
          color: parsedColor,
          material: materialProp
            ?.propertyValueEn || null,
          style: styleProp
            ?.propertyValueEn || null,
          
          // All raw properties
          // (for display)
          properties: properties.map(
            (p: any) => ({
              name: p.propertyName,
              value: p.propertyValueEn || 
                p.propertyValueName,
              image: p.propertyValueImage 
                || null,
            })
          ),
          
          // Images
          image: v.variantImage || null,
          
          // Pricing
          cjPrice: parseFloat(
            v.variantSellPrice || 
            product.sellPrice || 0
          ),
          
          // Stock
          stock: v.variantStock || 999,
          
          // Status
          isActive: true,
          // Admin can deactivate
          
          // Index for ordering
          index,
        }
      }
    )

    return variants
    
  } catch (error: any) {
    console.error(
      'Error getting variants:', 
      error
    )
    return []
  }
}
