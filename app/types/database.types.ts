export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.0.2 (a4e00ff)'
  }
  public: {
    Tables: {
      colors: {
        Row: {
          code: string
          created_at: string
          fts: unknown | null
          hex: string
          id: number
          name: string | null
          system: string
        }
        Insert: {
          code: string
          created_at?: string
          fts?: unknown | null
          hex: string
          id?: number
          name?: string | null
          system: string
        }
        Update: {
          code?: string
          created_at?: string
          fts?: unknown | null
          hex?: string
          id?: number
          name?: string | null
          system?: string
        }
        Relationships: []
      }
      colorways: {
        Row: {
          colorway_id: string
          created_at: string
          currency: string | null
          deleted: boolean | null
          description: string | null
          fts: unknown | null
          id: number
          img: string | null
          maker_id: string
          maker_sculpt_id: string
          name: string
          order: number | null
          photo_credit: string | null
          price: number | null
          qty: number | null
          release: string | null
          sale_type: string | null
          sculpt_id: string
          stem: string[] | null
        }
        Insert: {
          colorway_id: string
          created_at?: string
          currency?: string | null
          deleted?: boolean | null
          description?: string | null
          fts?: unknown | null
          id?: number
          img?: string | null
          maker_id: string
          maker_sculpt_id: string
          name: string
          order?: number | null
          photo_credit?: string | null
          price?: number | null
          qty?: number | null
          release?: string | null
          sale_type?: string | null
          sculpt_id: string
          stem?: string[] | null
        }
        Update: {
          colorway_id?: string
          created_at?: string
          currency?: string | null
          deleted?: boolean | null
          description?: string | null
          fts?: unknown | null
          id?: number
          img?: string | null
          maker_id?: string
          maker_sculpt_id?: string
          name?: string
          order?: number | null
          photo_credit?: string | null
          price?: number | null
          qty?: number | null
          release?: string | null
          sale_type?: string | null
          sculpt_id?: string
          stem?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: 'colorways_maker_id_fkey'
            columns: ['maker_id']
            isOneToOne: false
            referencedRelation: 'makers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'colorways_maker_sculpt_id_fkey'
            columns: ['maker_sculpt_id']
            isOneToOne: false
            referencedRelation: 'sculpts'
            referencedColumns: ['maker_sculpt_id']
          },
        ]
      }
      feedbacks: {
        Row: {
          created_at: string
          email: string | null
          id: number
          message: string | null
          name: string | null
          resolved: boolean | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          message?: string | null
          name?: string | null
          resolved?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          message?: string | null
          name?: string | null
          resolved?: boolean | null
        }
        Relationships: []
      }
      keycap_colors: {
        Row: {
          color_id: number
          created_at: string
          id: number
          profile_keycap_id: string
        }
        Insert: {
          color_id: number
          created_at?: string
          id?: number
          profile_keycap_id: string
        }
        Update: {
          color_id?: number
          created_at?: string
          id?: number
          profile_keycap_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'keycap_colors_color_id_fkey'
            columns: ['color_id']
            isOneToOne: false
            referencedRelation: 'colors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'keycap_colors_profile_keycap_id_fkey'
            columns: ['profile_keycap_id']
            isOneToOne: false
            referencedRelation: 'keycaps'
            referencedColumns: ['profile_keycap_id']
          },
        ]
      }
      keycap_kits: {
        Row: {
          cancelled: boolean
          created_at: string
          description: string | null
          id: number
          img: string
          name: string
          price: number | null
          profile_keycap_id: string
          qty: number | null
        }
        Insert: {
          cancelled?: boolean
          created_at?: string
          description?: string | null
          id?: number
          img: string
          name: string
          price?: number | null
          profile_keycap_id: string
          qty?: number | null
        }
        Update: {
          cancelled?: boolean
          created_at?: string
          description?: string | null
          id?: number
          img?: string
          name?: string
          price?: number | null
          profile_keycap_id?: string
          qty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'keycap_kits_profile_keycap_id_fkey'
            columns: ['profile_keycap_id']
            isOneToOne: false
            referencedRelation: 'keycaps'
            referencedColumns: ['profile_keycap_id']
          },
        ]
      }
      keycap_profiles: {
        Row: {
          description: string | null
          id: string
          manufacturer: string | null
          manufacturer_id: string | null
          name: string
          profile: Database['public']['Enums']['KeycapProfile'] | null
        }
        Insert: {
          description?: string | null
          id: string
          manufacturer?: string | null
          manufacturer_id?: string | null
          name: string
          profile?: Database['public']['Enums']['KeycapProfile'] | null
        }
        Update: {
          description?: string | null
          id?: string
          manufacturer?: string | null
          manufacturer_id?: string | null
          name?: string
          profile?: Database['public']['Enums']['KeycapProfile'] | null
        }
        Relationships: []
      }
      keycaps: {
        Row: {
          cover_img: string | null
          created_at: string
          description: string | null
          designer: string | null
          end_date: string | null
          fts: unknown | null
          ic_date: string | null
          id: number
          img: string | null
          name: string
          order_graph: string | null
          order_history: string | null
          profile_id: string
          profile_keycap_id: string
          render_img: string | null
          review_status: Database['public']['Enums']['ReviewStatus'] | null
          sculpt: string | null
          start_date: string | null
          status: string | null
          url: string | null
        }
        Insert: {
          cover_img?: string | null
          created_at?: string
          description?: string | null
          designer?: string | null
          end_date?: string | null
          fts?: unknown | null
          ic_date?: string | null
          id?: number
          img?: string | null
          name: string
          order_graph?: string | null
          order_history?: string | null
          profile_id: string
          profile_keycap_id: string
          render_img?: string | null
          review_status?: Database['public']['Enums']['ReviewStatus'] | null
          sculpt?: string | null
          start_date?: string | null
          status?: string | null
          url?: string | null
        }
        Update: {
          cover_img?: string | null
          created_at?: string
          description?: string | null
          designer?: string | null
          end_date?: string | null
          fts?: unknown | null
          ic_date?: string | null
          id?: number
          img?: string | null
          name?: string
          order_graph?: string | null
          order_history?: string | null
          profile_id?: string
          profile_keycap_id?: string
          render_img?: string | null
          review_status?: Database['public']['Enums']['ReviewStatus'] | null
          sculpt?: string | null
          start_date?: string | null
          status?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'keycaps_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'keycap_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      makers: {
        Row: {
          artisancollector: string | null
          bio: string | null
          contributors: Json[] | null
          deleted: boolean
          discord: string | null
          document_ids: Json[] | null
          founded: string | null
          fts: unknown | null
          id: string
          instagram: string | null
          invertible_logo: boolean | null
          name: string
          nationality: string | null
          updated_at: string | null
          verified: boolean
          website: string | null
        }
        Insert: {
          artisancollector?: string | null
          bio?: string | null
          contributors?: Json[] | null
          deleted?: boolean
          discord?: string | null
          document_ids?: Json[] | null
          founded?: string | null
          fts?: unknown | null
          id: string
          instagram?: string | null
          invertible_logo?: boolean | null
          name: string
          nationality?: string | null
          updated_at?: string | null
          verified?: boolean
          website?: string | null
        }
        Update: {
          artisancollector?: string | null
          bio?: string | null
          contributors?: Json[] | null
          deleted?: boolean
          discord?: string | null
          document_ids?: Json[] | null
          founded?: string | null
          fts?: unknown | null
          id?: string
          instagram?: string | null
          invertible_logo?: boolean | null
          name?: string
          nationality?: string | null
          updated_at?: string | null
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          date: string
          fts: unknown | null
          id: number
          maker_id: string
          sculpt_id: string
          sculpt_name: string | null
          title: string
        }
        Insert: {
          date: string
          fts?: unknown | null
          id?: number
          maker_id: string
          sculpt_id: string
          sculpt_name?: string | null
          title: string
        }
        Update: {
          date?: string
          fts?: unknown | null
          id?: number
          maker_id?: string
          sculpt_id?: string
          sculpt_name?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sales_maker_id_fkey'
            columns: ['maker_id']
            isOneToOne: false
            referencedRelation: 'makers'
            referencedColumns: ['id']
          },
        ]
      }
      sculpts: {
        Row: {
          cast: string | null
          collection: string | null
          created_at: string
          design: string | null
          fts: unknown | null
          href: string | null
          id: number
          img: string | null
          is_revision_of: string | null
          maker_id: string
          maker_sculpt_id: string
          name: string
          profile: string | null
          release: string | null
          sculpt_id: string
          story: string | null
        }
        Insert: {
          cast?: string | null
          collection?: string | null
          created_at?: string
          design?: string | null
          fts?: unknown | null
          href?: string | null
          id?: number
          img?: string | null
          is_revision_of?: string | null
          maker_id: string
          maker_sculpt_id: string
          name: string
          profile?: string | null
          release?: string | null
          sculpt_id: string
          story?: string | null
        }
        Update: {
          cast?: string | null
          collection?: string | null
          created_at?: string
          design?: string | null
          fts?: unknown | null
          href?: string | null
          id?: number
          img?: string | null
          is_revision_of?: string | null
          maker_id?: string
          maker_sculpt_id?: string
          name?: string
          profile?: string | null
          release?: string | null
          sculpt_id?: string
          story?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'sculpts_is_revision_of_fkey'
            columns: ['is_revision_of']
            isOneToOne: false
            referencedRelation: 'sculpts'
            referencedColumns: ['maker_sculpt_id']
          },
          {
            foreignKeyName: 'sculpts_maker_id_fkey'
            columns: ['maker_id']
            isOneToOne: false
            referencedRelation: 'makers'
            referencedColumns: ['id']
          },
        ]
      }
      user_collection_items: {
        Row: {
          artisan_item_id: number | null
          collection_id: string
          exchange: boolean
          id: number
          keycap_item_id: string | null
          order: number | null
          priority: boolean
          uid: string
        }
        Insert: {
          artisan_item_id?: number | null
          collection_id: string
          exchange?: boolean
          id?: number
          keycap_item_id?: string | null
          order?: number | null
          priority?: boolean
          uid: string
        }
        Update: {
          artisan_item_id?: number | null
          collection_id?: string
          exchange?: boolean
          id?: number
          keycap_item_id?: string | null
          order?: number | null
          priority?: boolean
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_collection_items_artisan_item_id_fkey'
            columns: ['artisan_item_id']
            isOneToOne: false
            referencedRelation: 'colorways'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_collection_items_collection_id_fkey'
            columns: ['collection_id']
            isOneToOne: false
            referencedRelation: 'user_collections'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_collection_items_keycap_item_id_fkey'
            columns: ['keycap_item_id']
            isOneToOne: false
            referencedRelation: 'keycaps'
            referencedColumns: ['profile_keycap_id']
          },
          {
            foreignKeyName: 'user_collection_items_uid_fkey'
            columns: ['uid']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_collections: {
        Row: {
          category: string
          contact: string | null
          created_at: string
          id: string
          intent: string
          message: string | null
          name: string
          published: boolean
          sort_by: string | null
          uid: string
        }
        Insert: {
          category?: string
          contact?: string | null
          created_at?: string
          id?: string
          intent: string
          message?: string | null
          name: string
          published?: boolean
          sort_by?: string | null
          uid: string
        }
        Update: {
          category?: string
          contact?: string | null
          created_at?: string
          id?: string
          intent?: string
          message?: string | null
          name?: string
          published?: boolean
          sort_by?: string | null
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_collections_uid_fkey'
            columns: ['uid']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          assignments: string[] | null
          discord: string | null
          email: string
          favorite_makers: Json | null
          id: string
          qq: string | null
          reddit: string | null
          role: string | null
        }
        Insert: {
          assignments?: string[] | null
          discord?: string | null
          email: string
          favorite_makers?: Json | null
          id: string
          qq?: string | null
          reddit?: string | null
          role?: string | null
        }
        Update: {
          assignments?: string[] | null
          discord?: string | null
          email?: string
          favorite_makers?: Json | null
          id?: string
          qq?: string | null
          reddit?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      KeycapProfile:
        | 'Cherry'
        | 'SA'
        | 'MT3'
        | 'MTNU'
        | 'KAT'
        | 'DCS'
        | 'DSS'
        | 'DSA'
        | 'XDA'
        | 'KAM'
      ReviewStatus: 'Pending' | 'Approved' | 'Rejected'
      Role: 'admin' | 'editor' | 'maker' | 'designer' | 'donator'
      Status:
        | 'Interest Check'
        | 'Scheduled'
        | 'Live'
        | 'In Production'
        | 'Shipping'
        | 'Complete'
        | 'Cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      KeycapProfile: [
        'Cherry',
        'SA',
        'MT3',
        'MTNU',
        'KAT',
        'DCS',
        'DSS',
        'DSA',
        'XDA',
        'KAM',
      ],
      ReviewStatus: ['Pending', 'Approved', 'Rejected'],
      Role: ['admin', 'editor', 'maker', 'designer', 'donator'],
      Status: [
        'Interest Check',
        'Scheduled',
        'Live',
        'In Production',
        'Shipping',
        'Complete',
        'Cancelled',
      ],
    },
  },
} as const
