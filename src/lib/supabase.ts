import { createClient } from '@supabase/supabase-js'
import type { Product, Category, Order, Customer, Review, WishlistItem, Coupon, Banner } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey
)

export type Database = {
  public: {
    Tables: {
      products: { Row: Product }
      categories: { Row: Category }
      orders: { Row: Order }
      customers: { Row: Customer }
      reviews: { Row: Review }
      wishlist: { Row: WishlistItem }
      coupons: { Row: Coupon }
      banners: { Row: Banner }
    }
  }
}
