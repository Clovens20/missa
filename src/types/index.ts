export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  short_description?: string
  meta_description?: string
  sku?: string
  weight?: number
  price: number
  compare_price?: number
  category_id?: string
  images: ProductImage[]
  variants: ProductVariant[]
  tags: string[]
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  is_new: boolean
  is_on_sale: boolean
  rating: number
  review_count: number
  sold_count: number
  created_at: string
  category?: Category
  flash_sale_ends_at?: string
  review_avg?: number
  review_breakdown?: Record<string, number>
  is_dropship?: boolean
  shipping_time?: string
  colors?: string[]
  available_colors?: string[]
  sizes?: string[]
  available_sizes?: string[]
  variant_images?: Record<string, ProductImage[]>
  availability_type?: string
  available_countries?: string[]
}

export interface ProductImage {
  url: string
  alt?: string
  is_primary?: boolean
}

export interface ProductVariant {
  id: string
  size?: string
  color?: string
  stock: number
  price?: number
  images?: ProductImage[]
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  parent_id?: string
  sort_order: number
  is_active: boolean
}

export interface CartItem {
  id: string
  product: Product
  quantity: number
  variant?: ProductVariant
}

export interface Order {
  id: string
  order_number: string
  customer_email: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  created_at: string
}

export type OrderStatus = 
  | 'pending' | 'confirmed' 
  | 'processing' | 'shipped' 
  | 'delivered' | 'cancelled'

export interface OrderItem {
  product_id: string
  name: string
  price: number
  qty: number
  image: string
}

export interface Customer {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  avatar_url?: string
  total_orders: number
  total_spent: number
}

export interface Review {
  id: string
  product_id: string
  customer_name: string
  rating: number
  title?: string
  comment?: string
  is_approved: boolean
  created_at: string
}

export interface WishlistItem {
  id: string
  customer_id: string
  product_id: string
  product?: Product
}

export interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order: number
  is_active: boolean
}

export interface Banner {
  id: string
  title?: string
  subtitle?: string
  image_url: string
  link?: string
  sort_order: number
  is_active: boolean
}
