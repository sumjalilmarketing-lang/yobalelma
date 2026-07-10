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
          role: Database["public"]["Enums"]["user_role"];
          preferred_language: string;
          is_verified: boolean;
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
          role?: Database["public"]["Enums"]["user_role"];
          preferred_language?: string;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          city?: string | null;
          country?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          preferred_language?: string;
          is_verified?: boolean;
          updated_at?: string;
        };
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
    Functions: Record<string, never>;
    Enums: {
      user_role: "sender" | "traveler" | "both" | "admin";
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
