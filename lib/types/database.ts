// Auto-generated Supabase DB types — matches 001_customer_schema.sql
// Regenerate with: npx supabase gen types typescript --project-id <id> > lib/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Enums ────────────────────────────────────────────────────
export type UserType        = 'customer' | 'campus_rep' | 'account_manager' | 'admin'
export type OrderStatus     = 'new' | 'proof_pending' | 'proof_ready' | 'approved' | 'in_production' | 'shipped' | 'complete'
export type OrderType       = 'group_order' | 'get_a_link'
export type PrintType       = 'screen_print' | 'embroidery' | 'puff_print' | 'foil' | 'dye_sublimation'
export type ProofStatus     = 'pending' | 'approved' | 'revision_requested'
export type DesignDirection = 'copy_exactly' | 'use_as_inspiration' | 'designers_choice'

export type PriceTier = {
  min_qty:        number
  price_per_unit: number
}

// ── Table row types ──────────────────────────────────────────
export interface UserRow {
  id:             string
  name:           string
  email:          string
  user_type:      UserType
  organization:   string | null
  school:         string | null
  loyalty_points: number
  avatar_url:     string | null
  created_at:     string
  updated_at:     string
}

export interface ProductRow {
  id:                  string
  sku:                 string
  name:                string
  category:            string
  turnaround_days:     number
  starting_price:      number
  is_featured:         boolean
  description:         string | null
  image_url:           string | null
  shopify_product_id:  string | null
  created_at:          string
  updated_at:          string
}

export interface ProductPrintTypeRow {
  id:           string
  product_id:   string
  print_type:   PrintType
  min_quantity: number
}

export interface OrderRow {
  id:                       string
  customer_id:              string
  event_name:               string
  due_date:                 string
  status:                   OrderStatus
  order_type:               OrderType
  front_design_description: string | null
  back_design_description:  string | null
  front_design_file_path:   string | null
  back_design_file_path:    string | null
  design_direction:         DesignDirection | null
  selected_print_type:      PrintType | null
  notes:                    string | null
  created_at:               string
  updated_at:               string
}

export interface OrderProductRow {
  id:         string
  order_id:   string
  product_id: string
  color:      string | null
  quantity:   number | null
  unit_price: number | null
}

export interface ProofRow {
  id:               string
  order_id:         string
  product_id:       string
  proof_number:     number
  color:            string
  print_type:       PrintType
  est_ship_date:    string | null
  price_tiers:      PriceTier[]
  mockup_image_url: string | null
  status:           ProofStatus
  uploaded_at:      string
  created_at:       string
  updated_at:       string
}

export interface RevisionRequestRow {
  id:          string
  proof_id:    string
  customer_id: string
  notes:       string
  created_at:  string
}

// ── Supabase Database type (used with createClient<Database>) ─
export type Database = {
  public: {
    Tables: {
      users: {
        Row:    UserRow
        Insert: Partial<UserRow>
        Update: Partial<UserRow>
        Relationships: []
      }
      products: {
        Row:    ProductRow
        Insert: Partial<ProductRow>
        Update: Partial<ProductRow>
        Relationships: []
      }
      product_print_types: {
        Row:    ProductPrintTypeRow
        Insert: Partial<ProductPrintTypeRow>
        Update: Partial<ProductPrintTypeRow>
        Relationships: [
          {
            foreignKeyName: "product_print_types_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row:    OrderRow
        Insert: Partial<OrderRow>
        Update: Partial<OrderRow>
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      order_products: {
        Row:    OrderProductRow
        Insert: Partial<OrderProductRow>
        Update: Partial<OrderProductRow>
        Relationships: [
          {
            foreignKeyName: "order_products_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      proofs: {
        Row:    ProofRow
        Insert: Partial<ProofRow>
        Update: Partial<ProofRow>
        Relationships: [
          {
            foreignKeyName: "proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proofs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      revision_requests: {
        Row:    RevisionRequestRow
        Insert: Partial<RevisionRequestRow>
        Update: Partial<RevisionRequestRow>
        Relationships: [
          {
            foreignKeyName: "revision_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_requests_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: false
            referencedRelation: "proofs"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: UserType
      order_status: OrderStatus
      order_type: OrderType
      print_type: PrintType
      proof_status: ProofStatus
      design_direction: DesignDirection
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
