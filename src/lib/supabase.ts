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
      products: { Row: Product, Insert: any, Update: any }
      categories: { Row: Category, Insert: any, Update: any }
      orders: { Row: Order, Insert: any, Update: any }
      customers: { Row: Customer, Insert: any, Update: any }
      reviews: { Row: Review, Insert: any, Update: any }
      wishlist: { Row: WishlistItem, Insert: any, Update: any }
      coupons: { Row: Coupon, Insert: any, Update: any }
      banners: { Row: Banner, Insert: any, Update: any }
      dropship_products: { 
        Row: { id: string; name: string; slug: string; selling_price: number; images: any[]; is_active: boolean }; 
        Insert: any; 
        Update: any 
      }
      collection_subscribers: { 
        Row: { id: string; email: string; confirmed: boolean; notify_new_products: boolean; emails_sent: number; last_email_at: string; unsubscribe_token: string }; 
        Insert: any; 
        Update: any 
      }
      collection_notifications: { 
        Row: { id: string; subject: string; type: string; products: any[]; recipients_count: number; created_at: string }; 
        Insert: any; 
        Update: any 
      }
    }
  }
}
