export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          city: string | null;
          country: string | null;
          address_line1: string | null;
          address_line2: string | null;
          postal_code: string | null;
          avatar_url: string | null;
          role: Database["public"]["Enums"]["user_role"];
          primary_role: Database["public"]["Enums"]["user_role"];
          preferred_language: string;
          account_status: Database["public"]["Enums"]["account_status"];
          identity_status: Database["public"]["Enums"]["identity_verification_status"];
          is_verified: boolean;
          last_sign_in_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          city?: string | null;
          country?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          postal_code?: string | null;
          avatar_url?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          primary_role?: Database["public"]["Enums"]["user_role"];
          preferred_language?: string;
          account_status?: Database["public"]["Enums"]["account_status"];
          identity_status?: Database["public"]["Enums"]["identity_verification_status"];
          is_verified?: boolean;
          last_sign_in_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          city?: string | null;
          country?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          postal_code?: string | null;
          avatar_url?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          primary_role?: Database["public"]["Enums"]["user_role"];
          preferred_language?: string;
          account_status?: Database["public"]["Enums"]["account_status"];
          identity_status?: Database["public"]["Enums"]["identity_verification_status"];
          is_verified?: boolean;
          last_sign_in_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_assignments: {
        Row: {
          id: string;
          profile_id: string;
          role: Database["public"]["Enums"]["user_role"];
          assigned_by: string | null;
          status: string;
          reason: string | null;
          starts_at: string;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          role: Database["public"]["Enums"]["user_role"];
          assigned_by?: string | null;
          status?: string;
          reason?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["role_assignments"]["Insert"]>;
        Relationships: [];
      };
      identity_verifications: {
        Row: {
          id: string;
          profile_id: string;
          document_type: Database["public"]["Enums"]["identity_document_type"];
          document_number: string | null;
          issuing_country: string;
          expires_on: string;
          status: Database["public"]["Enums"]["identity_verification_status"];
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          document_type: Database["public"]["Enums"]["identity_document_type"];
          document_number?: string | null;
          issuing_country: string;
          expires_on: string;
          status?: Database["public"]["Enums"]["identity_verification_status"];
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["identity_verifications"]["Insert"]>;
        Relationships: [];
      };
      identity_verification_documents: {
        Row: {
          id: string;
          verification_id: string;
          profile_id: string;
          document_kind: Database["public"]["Enums"]["identity_document_kind"];
          storage_bucket: string;
          storage_path: string;
          mime_type: string | null;
          file_size_bytes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          verification_id: string;
          profile_id: string;
          document_kind: Database["public"]["Enums"]["identity_document_kind"];
          storage_bucket?: string;
          storage_path: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["identity_verification_documents"]["Insert"]
        >;
        Relationships: [];
      };
      identity_verification_decisions: {
        Row: {
          id: string;
          verification_id: string;
          actor_id: string;
          decision: Database["public"]["Enums"]["identity_decision"];
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          verification_id: string;
          actor_id: string;
          decision: Database["public"]["Enums"]["identity_decision"];
          comment?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["identity_verification_decisions"]["Insert"]
        >;
        Relationships: [];
      };
      shipments: {
        Row: {
          id: string;
          tracking_code: string;
          sender_id: string;
          scope: Database["public"]["Enums"]["shipment_scope"];
          service_level: Database["public"]["Enums"]["shipment_service_level"];
          status: Database["public"]["Enums"]["shipment_status"];
          origin_city: string;
          origin_country: string;
          destination_city: string;
          destination_country: string;
          preferred_pickup_date: string;
          latest_delivery_date: string;
          estimated_price_cents: number;
          currency: string;
          eta_min_days: number;
          eta_max_days: number;
          digital_twin: Json;
          confirmation_accepted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tracking_code?: string;
          sender_id: string;
          scope: Database["public"]["Enums"]["shipment_scope"];
          service_level?: Database["public"]["Enums"]["shipment_service_level"];
          status?: Database["public"]["Enums"]["shipment_status"];
          origin_city: string;
          origin_country: string;
          destination_city: string;
          destination_country: string;
          preferred_pickup_date: string;
          latest_delivery_date: string;
          estimated_price_cents: number;
          currency?: string;
          eta_min_days: number;
          eta_max_days: number;
          digital_twin: Json;
          confirmation_accepted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipments"]["Insert"]>;
        Relationships: [];
      };
      shipment_addresses: {
        Row: {
          id: string;
          shipment_id: string;
          type: Database["public"]["Enums"]["shipment_address_type"];
          contact_name: string;
          contact_phone: string;
          contact_email: string | null;
          address_line1: string;
          address_line2: string | null;
          city: string;
          postal_code: string | null;
          country: string;
          instructions: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          type: Database["public"]["Enums"]["shipment_address_type"];
          contact_name: string;
          contact_phone: string;
          contact_email?: string | null;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          postal_code?: string | null;
          country: string;
          instructions?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipment_addresses"]["Insert"]>;
        Relationships: [];
      };
      shipment_packages: {
        Row: {
          id: string;
          shipment_id: string;
          category: Database["public"]["Enums"]["package_category"];
          title: string;
          description: string;
          weight_kg: number;
          length_cm: number;
          width_cm: number;
          height_cm: number;
          declared_value_cents: number;
          fragile: boolean;
          prohibited_items_confirmed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          category: Database["public"]["Enums"]["package_category"];
          title: string;
          description: string;
          weight_kg: number;
          length_cm: number;
          width_cm: number;
          height_cm: number;
          declared_value_cents?: number;
          fragile?: boolean;
          prohibited_items_confirmed?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipment_packages"]["Insert"]>;
        Relationships: [];
      };
      shipment_status_events: {
        Row: {
          id: string;
          shipment_id: string;
          actor_id: string | null;
          status: Database["public"]["Enums"]["shipment_status"];
          note: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          actor_id?: string | null;
          status: Database["public"]["Enums"]["shipment_status"];
          note?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipment_status_events"]["Insert"]>;
        Relationships: [];
      };
      transporter_profiles: {
        Row: {
          profile_id: string;
          business_name: string;
          bio: string;
          base_city: string;
          base_country: string;
          max_weight_kg: number;
          status: Database["public"]["Enums"]["transporter_status"];
          rating: number;
          completed_missions: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          business_name: string;
          bio: string;
          base_city: string;
          base_country: string;
          max_weight_kg: number;
          status?: Database["public"]["Enums"]["transporter_status"];
          rating?: number;
          completed_missions?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transporter_profiles"]["Insert"]>;
        Relationships: [];
      };
      transporter_vehicles: {
        Row: {
          id: string;
          profile_id: string;
          type: Database["public"]["Enums"]["vehicle_type"];
          label: string;
          plate_number: string | null;
          capacity_kg: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          type: Database["public"]["Enums"]["vehicle_type"];
          label: string;
          plate_number?: string | null;
          capacity_kg: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transporter_vehicles"]["Insert"]>;
        Relationships: [];
      };
      transporter_zones: {
        Row: {
          id: string;
          profile_id: string;
          city: string;
          country: string;
          radius_km: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          city: string;
          country: string;
          radius_km: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transporter_zones"]["Insert"]>;
        Relationships: [];
      };
      transporter_availability: {
        Row: {
          id: string;
          profile_id: string;
          available_on: string;
          starts_at: string;
          ends_at: string;
          status: Database["public"]["Enums"]["transporter_availability_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          available_on: string;
          starts_at: string;
          ends_at: string;
          status?: Database["public"]["Enums"]["transporter_availability_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["transporter_availability"]["Insert"]
        >;
        Relationships: [];
      };
      local_delivery_missions: {
        Row: {
          id: string;
          shipment_id: string;
          transporter_id: string;
          status: Database["public"]["Enums"]["local_delivery_mission_status"];
          score: number;
          reason: string[];
          offered_at: string | null;
          accepted_at: string | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          transporter_id: string;
          status?: Database["public"]["Enums"]["local_delivery_mission_status"];
          score?: number;
          reason?: string[];
          offered_at?: string | null;
          accepted_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["local_delivery_missions"]["Insert"]
        >;
        Relationships: [];
      };
      relay_points: {
        Row: {
          id: string;
          name: string;
          contact_name: string;
          contact_phone: string;
          address_line1: string;
          city: string;
          country: string;
          postal_code: string | null;
          capacity_slots: number;
          status: Database["public"]["Enums"]["relay_point_status"];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_name: string;
          contact_phone: string;
          address_line1: string;
          city: string;
          country: string;
          postal_code?: string | null;
          capacity_slots: number;
          status?: Database["public"]["Enums"]["relay_point_status"];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["relay_points"]["Insert"]>;
        Relationships: [];
      };
      relay_inventory: {
        Row: {
          id: string;
          shipment_id: string;
          current_relay_point_id: string;
          status: Database["public"]["Enums"]["relay_inventory_status"];
          checked_in_at: string;
          checked_out_at: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          current_relay_point_id: string;
          status?: Database["public"]["Enums"]["relay_inventory_status"];
          checked_in_at?: string;
          checked_out_at?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["relay_inventory"]["Insert"]>;
        Relationships: [];
      };
      relay_scan_events: {
        Row: {
          id: string;
          shipment_id: string;
          relay_point_id: string;
          actor_id: string;
          scan_type: Database["public"]["Enums"]["relay_scan_type"];
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          relay_point_id: string;
          actor_id: string;
          scan_type: Database["public"]["Enums"]["relay_scan_type"];
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["relay_scan_events"]["Insert"]>;
        Relationships: [];
      };
      collection_routes: {
        Row: {
          id: string;
          driver_id: string | null;
          name: string;
          route_date: string;
          status: Database["public"]["Enums"]["collection_route_status"];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id?: string | null;
          name: string;
          route_date: string;
          status?: Database["public"]["Enums"]["collection_route_status"];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["collection_routes"]["Insert"]>;
        Relationships: [];
      };
      collection_route_stops: {
        Row: {
          id: string;
          route_id: string;
          relay_point_id: string;
          stop_order: number;
          status: Database["public"]["Enums"]["collection_stop_status"];
          arrived_at: string | null;
          completed_at: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          route_id: string;
          relay_point_id: string;
          stop_order: number;
          status?: Database["public"]["Enums"]["collection_stop_status"];
          arrived_at?: string | null;
          completed_at?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["collection_route_stops"]["Insert"]
        >;
        Relationships: [];
      };
      parcel_requests: {
        Row: {
          id: string;
          sender_id: string;
          origin_city: string;
          origin_country: string;
          destination_city: string;
          destination_country: string;
          package_type: string;
          weight_kg: number;
          deadline: string;
          description: string;
          declared_value_cents: number;
          status: Database["public"]["Enums"]["parcel_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          origin_city: string;
          origin_country: string;
          destination_city: string;
          destination_country: string;
          package_type: string;
          weight_kg: number;
          deadline: string;
          description: string;
          declared_value_cents?: number;
          status?: Database["public"]["Enums"]["parcel_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["parcel_requests"]["Insert"]>;
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          traveler_id: string;
          origin_city: string;
          origin_country: string;
          destination_city: string;
          destination_country: string;
          departure_date: string;
          arrival_date: string;
          available_weight_kg: number;
          notes: string | null;
          status: Database["public"]["Enums"]["trip_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          traveler_id: string;
          origin_city: string;
          origin_country: string;
          destination_city: string;
          destination_country: string;
          departure_date: string;
          arrival_date: string;
          available_weight_kg: number;
          notes?: string | null;
          status?: Database["public"]["Enums"]["trip_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trips"]["Insert"]>;
        Relationships: [];
      };
      offers: {
        Row: {
          id: string;
          parcel_request_id: string;
          trip_id: string;
          traveler_id: string;
          price_cents: number;
          message: string | null;
          status: Database["public"]["Enums"]["offer_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parcel_request_id: string;
          trip_id: string;
          traveler_id: string;
          price_cents: number;
          message?: string | null;
          status?: Database["public"]["Enums"]["offer_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["offers"]["Insert"]>;
        Relationships: [];
      };
      tracking_events: {
        Row: {
          id: string;
          parcel_request_id: string;
          actor_id: string;
          event_type: Database["public"]["Enums"]["tracking_event_type"];
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parcel_request_id: string;
          actor_id: string;
          event_type: Database["public"]["Enums"]["tracking_event_type"];
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracking_events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_shipment: {
        Args: {
          p_currency: string;
          p_delivery_address: Json;
          p_destination_city: string;
          p_destination_country: string;
          p_digital_twin: Json;
          p_estimated_price_cents: number;
          p_eta_max_days: number;
          p_eta_min_days: number;
          p_latest_delivery_date: string;
          p_origin_city: string;
          p_origin_country: string;
          p_package: Json;
          p_pickup_address: Json;
          p_preferred_pickup_date: string;
          p_scope: Database["public"]["Enums"]["shipment_scope"];
          p_service_level: Database["public"]["Enums"]["shipment_service_level"];
        };
        Returns: { id: string; tracking_code: string }[];
      };
      create_local_delivery_mission: {
        Args: {
          p_shipment_id: string;
          p_transporter_id: string;
        };
        Returns: string;
      };
      current_user_has_role: {
        Args: { required_roles: string[] };
        Returns: boolean;
      };
      find_local_transporter_matches: {
        Args: { p_shipment_id: string };
        Returns: {
          business_name: string;
          reason: string[];
          score: number;
          transporter_id: string;
        }[];
      };
      record_relay_scan: {
        Args: {
          p_note?: string | null;
          p_relay_point_id: string;
          p_scan_type: Database["public"]["Enums"]["relay_scan_type"];
          p_tracking_code: string;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role:
        | "sender"
        | "traveler"
        | "both"
        | "admin"
        | "client"
        | "local_transporter"
        | "relay_agent"
        | "hub_agent"
        | "collection_driver"
        | "operations_manager"
        | "support_agent"
        | "super_admin";
      account_status: "pending_email_confirmation" | "active" | "suspended" | "closed";
      identity_verification_status:
        | "pending"
        | "submitted"
        | "approved"
        | "rejected"
        | "needs_more_information"
        | "expired";
      identity_document_type:
        | "national_id"
        | "passport"
        | "residence_permit"
        | "driver_license";
      identity_document_kind: "front" | "back" | "selfie" | "passport";
      identity_decision: "submitted" | "approved" | "rejected" | "needs_more_information";
      shipment_scope: "national" | "international";
      shipment_status:
        | "confirmed"
        | "matching"
        | "assigned"
        | "picked_up"
        | "in_transit"
        | "at_hub"
        | "out_for_delivery"
        | "delivered"
        | "cancelled";
      shipment_service_level: "standard" | "express";
      shipment_address_type: "pickup" | "delivery";
      package_category:
        | "documents"
        | "clothing"
        | "electronics"
        | "food_dry"
        | "cosmetics"
        | "other";
      transporter_status: "pending" | "active" | "suspended";
      vehicle_type: "bike" | "scooter" | "car" | "van" | "truck";
      transporter_availability_status: "available" | "booked" | "offline";
      local_delivery_mission_status:
        | "suggested"
        | "offered"
        | "accepted"
        | "picked_up"
        | "delivered"
        | "cancelled";
      relay_point_status: "active" | "inactive" | "suspended";
      relay_scan_type: "check_in" | "check_out" | "handover" | "exception";
      relay_inventory_status: "stored" | "released" | "exception";
      collection_route_status: "planned" | "in_progress" | "completed" | "cancelled";
      collection_stop_status: "pending" | "arrived" | "completed" | "skipped";
      parcel_status: "draft" | "open" | "matched" | "in_transit" | "delivered" | "cancelled";
      trip_status: "planned" | "boarding" | "arrived" | "cancelled";
      offer_status: "pending" | "accepted" | "declined" | "cancelled";
      tracking_event_type:
        | "created"
        | "matched"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "cancelled";
    };
    CompositeTypes: Record<string, never>;
  };
};
