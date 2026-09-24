export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          block: string
          created_at: string
          gate_note: string | null
          gate_note_kind: string
          house_no: string
          id: string
          is_default: boolean
          label: string
          lat: number
          lng: number
          phase: string
          street: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          block: string
          created_at?: string
          gate_note?: string | null
          gate_note_kind?: string
          house_no: string
          id?: string
          is_default?: boolean
          label?: string
          lat: number
          lng: number
          phase: string
          street?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          block?: string
          created_at?: string
          gate_note?: string | null
          gate_note_kind?: string
          house_no?: string
          id?: string
          is_default?: boolean
          label?: string
          lat?: number
          lng?: number
          phase?: string
          street?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          accept_buffer_min: number
          accept_timeout_sec: number
          delivery_fee_pkr: number
          dev_tools_enabled: boolean
          fast_lane_max_prep_min: number
          free_cap_pkr: number
          geofence_m: number
          guarantee_window_min: number
          handoff_min: number
          id: boolean
          kitchen_charge_pct: number
          location_broadcast_sec: number
          location_save_sec: number
          max_eta_min: number
          on_time_score_min_deliveries: number
          queue_penalty_min: number
          rain_extra_min: number
          rain_mode: boolean
          restaurant_radius_km: number
          rider_base_pay_pkr: number
          rider_per_km_pkr: number
          rider_soon_free_min: number
          rider_speed_kmh: number
          rider_stale_sec: number
          route_factor: number
          sim_running: boolean
          updated_at: string
          updated_by: string | null
          warp_app_anchor: string
          warp_factor: number
          warp_real_anchor: string
        }
        Insert: {
          accept_buffer_min?: number
          accept_timeout_sec?: number
          delivery_fee_pkr?: number
          dev_tools_enabled?: boolean
          fast_lane_max_prep_min?: number
          free_cap_pkr?: number
          geofence_m?: number
          guarantee_window_min?: number
          handoff_min?: number
          id?: boolean
          kitchen_charge_pct?: number
          location_broadcast_sec?: number
          location_save_sec?: number
          max_eta_min?: number
          on_time_score_min_deliveries?: number
          queue_penalty_min?: number
          rain_extra_min?: number
          rain_mode?: boolean
          restaurant_radius_km?: number
          rider_base_pay_pkr?: number
          rider_per_km_pkr?: number
          rider_soon_free_min?: number
          rider_speed_kmh?: number
          rider_stale_sec?: number
          route_factor?: number
          sim_running?: boolean
          updated_at?: string
          updated_by?: string | null
          warp_app_anchor?: string
          warp_factor?: number
          warp_real_anchor?: string
        }
        Update: {
          accept_buffer_min?: number
          accept_timeout_sec?: number
          delivery_fee_pkr?: number
          dev_tools_enabled?: boolean
          fast_lane_max_prep_min?: number
          free_cap_pkr?: number
          geofence_m?: number
          guarantee_window_min?: number
          handoff_min?: number
          id?: boolean
          kitchen_charge_pct?: number
          location_broadcast_sec?: number
          location_save_sec?: number
          max_eta_min?: number
          on_time_score_min_deliveries?: number
          queue_penalty_min?: number
          rain_extra_min?: number
          rain_mode?: boolean
          restaurant_radius_km?: number
          rider_base_pay_pkr?: number
          rider_per_km_pkr?: number
          rider_soon_free_min?: number
          rider_speed_kmh?: number
          rider_stale_sec?: number
          route_factor?: number
          sim_running?: boolean
          updated_at?: string
          updated_by?: string | null
          warp_app_anchor?: string
          warp_factor?: number
          warp_real_anchor?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          created_at: string
          description: string
          emoji: string
          id: string
          image_url: string | null
          is_active: boolean
          is_available: boolean
          is_popular: boolean
          name: string
          option_groups: Json
          prep_min: number
          price_pkr: number
          restaurant_id: string
          section_id: string | null
          sort: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          is_popular?: boolean
          name: string
          option_groups?: Json
          prep_min: number
          price_pkr: number
          restaurant_id: string
          section_id?: string | null
          sort?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          is_popular?: boolean
          name?: string
          option_groups?: Json
          prep_min?: number
          price_pkr?: number
          restaurant_id?: string
          section_id?: string | null
          sort?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "menu_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_sections: {
        Row: {
          created_at: string
          id: string
          name: string
          restaurant_id: string
          sort: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          restaurant_id: string
          sort?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          restaurant_id?: string
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_sections_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          at: string
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: number
          kind: string
          meta: Json
          order_id: string
          real_at: string
          to_status: Database["public"]["Enums"]["order_status"] | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: never
          kind: string
          meta?: Json
          order_id: string
          real_at?: string
          to_status?: Database["public"]["Enums"]["order_status"] | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: never
          kind?: string
          meta?: Json
          order_id?: string
          real_at?: string
          to_status?: Database["public"]["Enums"]["order_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          emoji: string
          id: string
          line_total_pkr: number
          menu_item_id: string | null
          name: string
          options: Json
          order_id: string
          prep_min: number
          qty: number
          unit_price_pkr: number
        }
        Insert: {
          emoji?: string
          id?: string
          line_total_pkr: number
          menu_item_id?: string | null
          name: string
          options?: Json
          order_id: string
          prep_min: number
          qty: number
          unit_price_pkr: number
        }
        Update: {
          emoji?: string
          id?: string
          line_total_pkr?: number
          menu_item_id?: string | null
          name?: string
          options?: Json
          order_id?: string
          prep_min?: number
          qty?: number
          unit_price_pkr?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_transitions: {
        Row: {
          from_status: Database["public"]["Enums"]["order_status"]
          roles: string[]
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          from_status: Database["public"]["Enums"]["order_status"]
          roles: string[]
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          from_status?: Database["public"]["Enums"]["order_status"]
          roles?: string[]
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: []
      }
      orders: {
        Row: {
          accept_by: string
          accepted_at: string | null
          address_id: string | null
          amount_to_collect_pkr: number
          arrival_accuracy_m: number | null
          arrival_distance_m: number | null
          arrival_flagged: boolean
          arrival_lat: number | null
          arrival_lng: number | null
          arrival_reason: string | null
          arrival_review_note: string | null
          arrival_reviewed_at: string | null
          arrival_within_geofence: boolean | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          code: string
          committed_prep_min: number | null
          created_at: string
          customer_id: string
          customer_name: string
          customer_note: string | null
          customer_phone: string | null
          delivered_at: string | null
          delivery_fee_pkr: number
          delivery_overrun_sec: number | null
          distance_km: number
          drop_address: string
          drop_gate_note: string | null
          drop_lat: number
          drop_lng: number
          free_amount_pkr: number
          free_cap_pkr: number
          guarantee_active: boolean
          guarantee_state: Database["public"]["Enums"]["guarantee_state"]
          id: string
          is_simulated: boolean
          items_subtotal_pkr: number
          kitchen_overrun_sec: number | null
          late_by_sec: number | null
          late_cause: Database["public"]["Enums"]["late_cause"] | null
          outcome_finalized_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          picked_up_at: string | null
          placed_at: string
          planned_delivery_min: number
          predicted_eta_min: number
          predicted_prep_min: number
          predicted_ride_min: number
          predicted_rider_min: number
          promised_by: string | null
          ready_at: string | null
          ready_by: string | null
          reject_reason: string | null
          rejected_at: string | null
          restaurant_charge_pkr: number
          restaurant_id: string
          rider_assigned_at: string | null
          rider_id: string | null
          rider_payout_pkr: number
          sealed_bag_photo_url: string | null
          settings_snapshot: Json
          sim: Json | null
          status: Database["public"]["Enums"]["order_status"]
          total_pkr: number
          updated_at: string
          window_min: number
        }
        Insert: {
          accept_by: string
          accepted_at?: string | null
          address_id?: string | null
          amount_to_collect_pkr: number
          arrival_accuracy_m?: number | null
          arrival_distance_m?: number | null
          arrival_flagged?: boolean
          arrival_lat?: number | null
          arrival_lng?: number | null
          arrival_reason?: string | null
          arrival_review_note?: string | null
          arrival_reviewed_at?: string | null
          arrival_within_geofence?: boolean | null
          arrived_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          code?: string
          committed_prep_min?: number | null
          created_at?: string
          customer_id: string
          customer_name?: string
          customer_note?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_fee_pkr: number
          delivery_overrun_sec?: number | null
          distance_km: number
          drop_address: string
          drop_gate_note?: string | null
          drop_lat: number
          drop_lng: number
          free_amount_pkr?: number
          free_cap_pkr: number
          guarantee_active: boolean
          guarantee_state: Database["public"]["Enums"]["guarantee_state"]
          id?: string
          is_simulated?: boolean
          items_subtotal_pkr: number
          kitchen_overrun_sec?: number | null
          late_by_sec?: number | null
          late_cause?: Database["public"]["Enums"]["late_cause"] | null
          outcome_finalized_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          picked_up_at?: string | null
          placed_at: string
          planned_delivery_min: number
          predicted_eta_min: number
          predicted_prep_min: number
          predicted_ride_min: number
          predicted_rider_min?: number
          promised_by?: string | null
          ready_at?: string | null
          ready_by?: string | null
          reject_reason?: string | null
          rejected_at?: string | null
          restaurant_charge_pkr?: number
          restaurant_id: string
          rider_assigned_at?: string | null
          rider_id?: string | null
          rider_payout_pkr?: number
          sealed_bag_photo_url?: string | null
          settings_snapshot?: Json
          sim?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          total_pkr: number
          updated_at?: string
          window_min: number
        }
        Update: {
          accept_by?: string
          accepted_at?: string | null
          address_id?: string | null
          amount_to_collect_pkr?: number
          arrival_accuracy_m?: number | null
          arrival_distance_m?: number | null
          arrival_flagged?: boolean
          arrival_lat?: number | null
          arrival_lng?: number | null
          arrival_reason?: string | null
          arrival_review_note?: string | null
          arrival_reviewed_at?: string | null
          arrival_within_geofence?: boolean | null
          arrived_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          code?: string
          committed_prep_min?: number | null
          created_at?: string
          customer_id?: string
          customer_name?: string
          customer_note?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_fee_pkr?: number
          delivery_overrun_sec?: number | null
          distance_km?: number
          drop_address?: string
          drop_gate_note?: string | null
          drop_lat?: number
          drop_lng?: number
          free_amount_pkr?: number
          free_cap_pkr?: number
          guarantee_active?: boolean
          guarantee_state?: Database["public"]["Enums"]["guarantee_state"]
          id?: string
          is_simulated?: boolean
          items_subtotal_pkr?: number
          kitchen_overrun_sec?: number | null
          late_by_sec?: number | null
          late_cause?: Database["public"]["Enums"]["late_cause"] | null
          outcome_finalized_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          picked_up_at?: string | null
          placed_at?: string
          planned_delivery_min?: number
          predicted_eta_min?: number
          predicted_prep_min?: number
          predicted_ride_min?: number
          predicted_rider_min?: number
          promised_by?: string | null
          ready_at?: string | null
          ready_by?: string | null
          reject_reason?: string | null
          rejected_at?: string | null
          restaurant_charge_pkr?: number
          restaurant_id?: string
          rider_assigned_at?: string | null
          rider_id?: string | null
          rider_payout_pkr?: number
          sealed_bag_photo_url?: string | null
          settings_snapshot?: Json
          sim?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          total_pkr?: number
          updated_at?: string
          window_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_collected_pkr: number | null
          amount_due_pkr: number
          amount_total_pkr: number
          amount_waived_pkr: number
          collected_at: string | null
          collected_by: string | null
          created_at: string
          id: string
          meta: Json
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          provider: string | null
          provider_ref: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_collected_pkr?: number | null
          amount_due_pkr: number
          amount_total_pkr: number
          amount_waived_pkr?: number
          collected_at?: string | null
          collected_by?: string | null
          created_at?: string
          id?: string
          meta?: Json
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_collected_pkr?: number | null
          amount_due_pkr?: number
          amount_total_pkr?: number
          amount_waived_pkr?: number
          collected_at?: string | null
          collected_by?: string | null
          created_at?: string
          id?: string
          meta?: Json
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_test: boolean
          phone: string | null
          restaurant_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          is_test?: boolean
          phone?: string | null
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_test?: boolean
          phone?: string | null
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string
          closes_at: string
          cluster: string
          created_at: string
          cuisines: string[]
          hero_emoji: string
          hero_from: string
          hero_image_url: string | null
          hero_to: string
          id: string
          is_accepting: boolean
          is_active: boolean
          lat: number
          lng: number
          name: string
          opens_at: string
          pause_reason: string | null
          paused_until: string | null
          phone: string | null
          price_level: number
          radius_km: number | null
          rating: number
          rating_count: number
          slug: string
          sort: number
          tagline: string
          updated_at: string
        }
        Insert: {
          address?: string
          closes_at?: string
          cluster?: string
          created_at?: string
          cuisines?: string[]
          hero_emoji?: string
          hero_from?: string
          hero_image_url?: string | null
          hero_to?: string
          id?: string
          is_accepting?: boolean
          is_active?: boolean
          lat: number
          lng: number
          name: string
          opens_at?: string
          pause_reason?: string | null
          paused_until?: string | null
          phone?: string | null
          price_level?: number
          radius_km?: number | null
          rating?: number
          rating_count?: number
          slug: string
          sort?: number
          tagline?: string
          updated_at?: string
        }
        Update: {
          address?: string
          closes_at?: string
          cluster?: string
          created_at?: string
          cuisines?: string[]
          hero_emoji?: string
          hero_from?: string
          hero_image_url?: string | null
          hero_to?: string
          id?: string
          is_accepting?: boolean
          is_active?: boolean
          lat?: number
          lng?: number
          name?: string
          opens_at?: string
          pause_reason?: string | null
          paused_until?: string | null
          phone?: string | null
          price_level?: number
          radius_km?: number | null
          rating?: number
          rating_count?: number
          slug?: string
          sort?: number
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      riders: {
        Row: {
          created_at: string
          current_order_id: string | null
          id: string
          is_active: boolean
          is_test: boolean
          job_rev: number
          last_accuracy_m: number | null
          last_lat: number | null
          last_lng: number | null
          last_seen_at: string | null
          plate: string | null
          status: Database["public"]["Enums"]["rider_status"]
          updated_at: string
          vehicle: string
        }
        Insert: {
          created_at?: string
          current_order_id?: string | null
          id: string
          is_active?: boolean
          is_test?: boolean
          job_rev?: number
          last_accuracy_m?: number | null
          last_lat?: number | null
          last_lng?: number | null
          last_seen_at?: string | null
          plate?: string | null
          status?: Database["public"]["Enums"]["rider_status"]
          updated_at?: string
          vehicle?: string
        }
        Update: {
          created_at?: string
          current_order_id?: string | null
          id?: string
          is_active?: boolean
          is_test?: boolean
          job_rev?: number
          last_accuracy_m?: number | null
          last_lat?: number | null
          last_lng?: number | null
          last_seen_at?: string | null
          plate?: string | null
          status?: Database["public"]["Enums"]["rider_status"]
          updated_at?: string
          vehicle?: string
        }
        Relationships: [
          {
            foreignKeyName: "riders_current_order_fk"
            columns: ["current_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riders_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          polygon: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          polygon: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          polygon?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analytics_report: {
        Args: { p_from: string; p_include_sim?: boolean; p_to: string }
        Returns: Json
      }
      app_now: { Args: never; Returns: string }
      apply_guarantee_outcome: {
        Args: { p: Json; p_order_id: string }
        Returns: {
          accept_by: string
          accepted_at: string | null
          address_id: string | null
          amount_to_collect_pkr: number
          arrival_accuracy_m: number | null
          arrival_distance_m: number | null
          arrival_flagged: boolean
          arrival_lat: number | null
          arrival_lng: number | null
          arrival_reason: string | null
          arrival_review_note: string | null
          arrival_reviewed_at: string | null
          arrival_within_geofence: boolean | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          code: string
          committed_prep_min: number | null
          created_at: string
          customer_id: string
          customer_name: string
          customer_note: string | null
          customer_phone: string | null
          delivered_at: string | null
          delivery_fee_pkr: number
          delivery_overrun_sec: number | null
          distance_km: number
          drop_address: string
          drop_gate_note: string | null
          drop_lat: number
          drop_lng: number
          free_amount_pkr: number
          free_cap_pkr: number
          guarantee_active: boolean
          guarantee_state: Database["public"]["Enums"]["guarantee_state"]
          id: string
          is_simulated: boolean
          items_subtotal_pkr: number
          kitchen_overrun_sec: number | null
          late_by_sec: number | null
          late_cause: Database["public"]["Enums"]["late_cause"] | null
          outcome_finalized_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          picked_up_at: string | null
          placed_at: string
          planned_delivery_min: number
          predicted_eta_min: number
          predicted_prep_min: number
          predicted_ride_min: number
          predicted_rider_min: number
          promised_by: string | null
          ready_at: string | null
          ready_by: string | null
          reject_reason: string | null
          rejected_at: string | null
          restaurant_charge_pkr: number
          restaurant_id: string
          rider_assigned_at: string | null
          rider_id: string | null
          rider_payout_pkr: number
          sealed_bag_photo_url: string | null
          settings_snapshot: Json
          sim: Json | null
          status: Database["public"]["Enums"]["order_status"]
          total_pkr: number
          updated_at: string
          window_min: number
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assign_rider: {
        Args: {
          p_actor_id: string
          p_actor_role: string
          p_order_id: string
          p_payout_pkr?: number
          p_rider_id: string
        }
        Returns: {
          accept_by: string
          accepted_at: string | null
          address_id: string | null
          amount_to_collect_pkr: number
          arrival_accuracy_m: number | null
          arrival_distance_m: number | null
          arrival_flagged: boolean
          arrival_lat: number | null
          arrival_lng: number | null
          arrival_reason: string | null
          arrival_review_note: string | null
          arrival_reviewed_at: string | null
          arrival_within_geofence: boolean | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          code: string
          committed_prep_min: number | null
          created_at: string
          customer_id: string
          customer_name: string
          customer_note: string | null
          customer_phone: string | null
          delivered_at: string | null
          delivery_fee_pkr: number
          delivery_overrun_sec: number | null
          distance_km: number
          drop_address: string
          drop_gate_note: string | null
          drop_lat: number
          drop_lng: number
          free_amount_pkr: number
          free_cap_pkr: number
          guarantee_active: boolean
          guarantee_state: Database["public"]["Enums"]["guarantee_state"]
          id: string
          is_simulated: boolean
          items_subtotal_pkr: number
          kitchen_overrun_sec: number | null
          late_by_sec: number | null
          late_cause: Database["public"]["Enums"]["late_cause"] | null
          outcome_finalized_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          picked_up_at: string | null
          placed_at: string
          planned_delivery_min: number
          predicted_eta_min: number
          predicted_prep_min: number
          predicted_ride_min: number
          predicted_rider_min: number
          promised_by: string | null
          ready_at: string | null
          ready_by: string | null
          reject_reason: string | null
          rejected_at: string | null
          restaurant_charge_pkr: number
          restaurant_id: string
          rider_assigned_at: string | null
          rider_id: string | null
          rider_payout_pkr: number
          sealed_bag_photo_url: string | null
          settings_snapshot: Json
          sim: Json | null
          status: Database["public"]["Enums"]["order_status"]
          total_pkr: number
          updated_at: string
          window_min: number
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_order: {
        Args: { p: Json }
        Returns: {
          accept_by: string
          accepted_at: string | null
          address_id: string | null
          amount_to_collect_pkr: number
          arrival_accuracy_m: number | null
          arrival_distance_m: number | null
          arrival_flagged: boolean
          arrival_lat: number | null
          arrival_lng: number | null
          arrival_reason: string | null
          arrival_review_note: string | null
          arrival_reviewed_at: string | null
          arrival_within_geofence: boolean | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          code: string
          committed_prep_min: number | null
          created_at: string
          customer_id: string
          customer_name: string
          customer_note: string | null
          customer_phone: string | null
          delivered_at: string | null
          delivery_fee_pkr: number
          delivery_overrun_sec: number | null
          distance_km: number
          drop_address: string
          drop_gate_note: string | null
          drop_lat: number
          drop_lng: number
          free_amount_pkr: number
          free_cap_pkr: number
          guarantee_active: boolean
          guarantee_state: Database["public"]["Enums"]["guarantee_state"]
          id: string
          is_simulated: boolean
          items_subtotal_pkr: number
          kitchen_overrun_sec: number | null
          late_by_sec: number | null
          late_cause: Database["public"]["Enums"]["late_cause"] | null
          outcome_finalized_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          picked_up_at: string | null
          placed_at: string
          planned_delivery_min: number
          predicted_eta_min: number
          predicted_prep_min: number
          predicted_ride_min: number
          predicted_rider_min: number
          promised_by: string | null
          ready_at: string | null
          ready_by: string | null
          reject_reason: string | null
          rejected_at: string | null
          restaurant_charge_pkr: number
          restaurant_id: string
          rider_assigned_at: string | null
          rider_id: string | null
          rider_payout_pkr: number
          sealed_bag_photo_url: string | null
          settings_snapshot: Json
          sim: Json | null
          status: Database["public"]["Enums"]["order_status"]
          total_pkr: number
          updated_at: string
          window_min: number
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      dev_delete_orders: {
        Args: { p_only_simulated?: boolean }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      karachi_day_start: { Args: never; Returns: string }
      my_restaurant_id: { Args: never; Returns: string }
      my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      public_on_time_score: { Args: never; Returns: Json }
      restaurant_today: { Args: { p_restaurant_id: string }; Returns: Json }
      rider_today: { Args: { p_rider_id: string }; Returns: Json }
      server_clock: { Args: never; Returns: Json }
      set_time_warp: { Args: { p_factor: number }; Returns: Json }
      sweep_candidates: {
        Args: never
        Returns: {
          order_id: string
          reason: string
        }[]
      }
      transition_order: {
        Args: {
          p_actor_id: string
          p_actor_role: string
          p_meta?: Json
          p_order_id: string
          p_patch?: Json
          p_to: Database["public"]["Enums"]["order_status"]
        }
        Returns: {
          accept_by: string
          accepted_at: string | null
          address_id: string | null
          amount_to_collect_pkr: number
          arrival_accuracy_m: number | null
          arrival_distance_m: number | null
          arrival_flagged: boolean
          arrival_lat: number | null
          arrival_lng: number | null
          arrival_reason: string | null
          arrival_review_note: string | null
          arrival_reviewed_at: string | null
          arrival_within_geofence: boolean | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          code: string
          committed_prep_min: number | null
          created_at: string
          customer_id: string
          customer_name: string
          customer_note: string | null
          customer_phone: string | null
          delivered_at: string | null
          delivery_fee_pkr: number
          delivery_overrun_sec: number | null
          distance_km: number
          drop_address: string
          drop_gate_note: string | null
          drop_lat: number
          drop_lng: number
          free_amount_pkr: number
          free_cap_pkr: number
          guarantee_active: boolean
          guarantee_state: Database["public"]["Enums"]["guarantee_state"]
          id: string
          is_simulated: boolean
          items_subtotal_pkr: number
          kitchen_overrun_sec: number | null
          late_by_sec: number | null
          late_cause: Database["public"]["Enums"]["late_cause"] | null
          outcome_finalized_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          picked_up_at: string | null
          placed_at: string
          planned_delivery_min: number
          predicted_eta_min: number
          predicted_prep_min: number
          predicted_ride_min: number
          predicted_rider_min: number
          promised_by: string | null
          ready_at: string | null
          ready_by: string | null
          reject_reason: string | null
          rejected_at: string | null
          restaurant_charge_pkr: number
          restaurant_id: string
          rider_assigned_at: string | null
          rider_id: string | null
          rider_payout_pkr: number
          sealed_bag_photo_url: string | null
          settings_snapshot: Json
          sim: Json | null
          status: Database["public"]["Enums"]["order_status"]
          total_pkr: number
          updated_at: string
          window_min: number
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      guarantee_state: "active" | "on_time" | "free" | "off" | "void"
      late_cause: "kitchen" | "delivery"
      order_status:
        | "placed"
        | "accepted"
        | "ready"
        | "picked_up"
        | "arrived"
        | "delivered"
        | "rejected"
        | "cancelled"
      payment_method: "cod" | "jazzcash" | "easypaisa" | "card"
      payment_status: "pending" | "collected" | "waived" | "void" | "refunded"
      rider_status: "offline" | "idle" | "busy"
      user_role: "customer" | "restaurant" | "rider" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      guarantee_state: ["active", "on_time", "free", "off", "void"],
      late_cause: ["kitchen", "delivery"],
      order_status: [
        "placed",
        "accepted",
        "ready",
        "picked_up",
        "arrived",
        "delivered",
        "rejected",
        "cancelled",
      ],
      payment_method: ["cod", "jazzcash", "easypaisa", "card"],
      payment_status: ["pending", "collected", "waived", "void", "refunded"],
      rider_status: ["offline", "idle", "busy"],
      user_role: ["customer", "restaurant", "rider", "admin"],
    },
  },
} as const

