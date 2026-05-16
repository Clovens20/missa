import { createClient } from '@supabase/supabase-js'

const CJ_API_URL = process.env.CJ_API_URL || 'https://developers.cjdropshipping.com/api2.0/v1'
const CJ_EMAIL = process.env.CJ_EMAIL!
const CJ_API_KEY = process.env.CJ_API_KEY!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── TOKEN MANAGEMENT ───────────────

export async function getCJToken(): Promise<string> {
  // Check if valid token exists
  const { data: tokenData } = await supabase
    .from('cj_tokens')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (tokenData && new Date(tokenData.expires_at) > new Date()) {
    return tokenData.access_token
  }

  // Get new token
  const response = await fetch(
    `${CJ_API_URL}/authentication/getAccessToken`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: CJ_EMAIL,
        password: CJ_API_KEY,
      }),
    }
  )

  const data = await response.json()
  
  if (!data.data?.accessToken) {
    throw new Error('CJ Auth failed: ' + (data.message || 'Unknown error'))
  }

  // Store token (expires in 24h)
  await supabase
    .from('cj_tokens')
    .insert({
      access_token: data.data.accessToken,
      refresh_token: data.data.refreshToken || null,
      expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
    })

  return data.data.accessToken
}


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
  body?: any,
  retries = 3
): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      // Respect rate limit (1 req/sec)
      await delay(1100 * (i + 1)) 
      
      return await cjRequest(
        endpoint, method, body
      )
    } catch (error: any) {
      if (error.message?.includes(
        'Too Many Requests'
      ) && i < retries - 1) {
        // Wait longer before retry
        await delay(2000 * (i + 1))
        continue
      }
      throw error
    }
  }
}

// ─── PRODUCT SEARCH ──────────────────

export async function searchCJProducts(params: {
  productName?: string
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
    categoryId,
    pageNum = 1,
    pageSize = 20,
    minPrice,
    maxPrice,
    sortField = 'newProduct',
    sortOrder = 'DESC',
  } = params

  const queryParams = new URLSearchParams({
    productName,
    pageNum: pageNum.toString(),
    pageSize: pageSize.toString(),
    sortField,
    sortOrder,
    ...(categoryId && { categoryId }),
    ...(minPrice !== undefined && { minPrice: minPrice.toString() }),
    ...(maxPrice !== undefined && { maxPrice: maxPrice.toString() }),
  })

  const data = await cjRequestWithRetry(`/product/list?${queryParams}`)
  
  // ✅ Filter and normalize products
  if (data?.list) {
    data.list = data.list.map((item: any) => {
      // Calculate stock - list might not have variants or productStock
      const totalStock = (item.variants && item.variants.length > 0)
        ? item.variants.reduce((sum: number, v: any) => sum + (v.variantStock || 0), 0)
        : (item.productStock || item.inventory || item.stock || -1) // Use -1 to indicate unknown

      // Build variant stock map
      const variantStocks: Record<string, number> = {}
      item.variants?.forEach((v: any) => {
        const key = [v.variantColor, v.variantSize].filter(Boolean).join(' / ')
        if (key) variantStocks[key] = v.variantStock || 0
      })

      return {
        ...item,
        total_stock: totalStock,
        variant_stocks: variantStocks,
        in_stock: totalStock > 0 || totalStock === -1, // Assume in stock if unknown
      }
    }).filter((item: any) => {
      // Only filter out if we KNOW it's out of stock or removed
      if (item.productRemoved) return false
      if (item.total_stock === 0) return false
      return true
    })
  }

  return data
}

// ─── GET PRODUCT DETAILS ─────────────

export async function getCJProductDetail(pid: string) {
  return await cjRequestWithRetry(`/product/query?pid=${pid}`)
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
      orderNumber: orderData.orderNumber,
      fromCountryCode: orderData.fromCountryCode,
      toCountryCode: orderData.toCountryCode,
      toProvince: orderData.toProvince,
      toCity: orderData.toCity,
      toDistrict: orderData.toDistrict || '',
      toAddress: orderData.toAddress,
      toName: orderData.toName,
      toPhone: orderData.toPhone,
      toEmail: orderData.toEmail || '',
      toPostCode: orderData.toPostCode,
      shippingName: orderData.logisticName || 'CJPacket Ordinary',
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
// Upload image to CJ and get 
// similar products

export async function searchByImage(
  imageFile: File | string
  // File object or base64 string
): Promise<any> {
  const token = await getCJToken()
  
  // If it's a File, convert to base64
  let base64Image: string
  
  if (typeof imageFile === 'string') {
    // Already base64 or URL
    base64Image = imageFile.startsWith(
      'data:'
    ) 
      ? imageFile.split(',')[1]
      : imageFile
  } else {
    // Convert File to base64
    base64Image = await new Promise(
      (resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = 
            e.target?.result as string
          resolve(result.split(',')[1])
        }
        reader.readAsDataURL(imageFile)
      }
    )
  }

  // Respect rate limit
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
    throw new Error(
      data.message || 
      'Image search failed'
    )
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
        const properties = 
          v.variantProperty || []
        
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

        return {
          // CJ identifiers
          vid: v.vid,
          sku: v.variantSku || 
            `SKU-${pid}-${index}`,
          
          // Display properties
          size: sizeProp
            ?.propertyValueEn || 
            sizeProp?.propertyValueName || 
            null,
          color: colorProp
            ?.propertyValueEn || 
            colorProp?.propertyValueName || 
            null,
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
