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
      current_user_has_role: {
        Args: { required_roles: string[] };
        Returns: boolean;
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
