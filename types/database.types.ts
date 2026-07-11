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
          fulfillment_method: Database["public"]["Enums"]["shipment_fulfillment_method"];
          package_photo_path: string | null;
          delivery_otp_code: string | null;
          delivery_otp_confirmed_at: string | null;
          proof_of_delivery_path: string | null;
          payout_eligible_for_release: boolean;
          payout_blocked_reason: string | null;
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
          fulfillment_method?: Database["public"]["Enums"]["shipment_fulfillment_method"];
          package_photo_path?: string | null;
          delivery_otp_code?: string | null;
          delivery_otp_confirmed_at?: string | null;
          proof_of_delivery_path?: string | null;
          payout_eligible_for_release?: boolean;
          payout_blocked_reason?: string | null;
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
      traveler_documents: {
        Row: {
          id: string;
          trip_id: string;
          traveler_id: string;
          traveler_name: string;
          document_number: string;
          issuing_country: string;
          departure_airport: string;
          arrival_airport: string;
          departure_date: string;
          arrival_date: string;
          file_path: string;
          extracted_payload: Json;
          confidence_score: number | null;
          manual_review_required: boolean;
          status: Database["public"]["Enums"]["travel_document_status"];
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          traveler_id: string;
          traveler_name: string;
          document_number: string;
          issuing_country: string;
          departure_airport: string;
          arrival_airport: string;
          departure_date: string;
          arrival_date: string;
          file_path: string;
          extracted_payload?: Json;
          confidence_score?: number | null;
          manual_review_required?: boolean;
          status?: Database["public"]["Enums"]["travel_document_status"];
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["traveler_documents"]["Insert"]>;
        Relationships: [];
      };
      hub_batches: {
        Row: {
          id: string;
          code: string;
          origin_hub: string;
          destination_hub: string;
          flight_number: string | null;
          departure_date: string;
          capacity_kg: number;
          reserved_weight_kg: number;
          status: Database["public"]["Enums"]["hub_batch_status"];
          trip_id: string | null;
          traveler_id: string | null;
          qr_payload: Json;
          created_by: string | null;
          sealed_by: string | null;
          sealed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          origin_hub: string;
          destination_hub: string;
          flight_number?: string | null;
          departure_date: string;
          capacity_kg: number;
          reserved_weight_kg?: number;
          status?: Database["public"]["Enums"]["hub_batch_status"];
          trip_id?: string | null;
          traveler_id?: string | null;
          qr_payload?: Json;
          created_by?: string | null;
          sealed_by?: string | null;
          sealed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["hub_batches"]["Insert"]>;
        Relationships: [];
      };
      capacity_reservations: {
        Row: {
          id: string;
          batch_id: string;
          shipment_id: string;
          reserved_weight_kg: number;
          status: Database["public"]["Enums"]["capacity_reservation_status"];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          shipment_id: string;
          reserved_weight_kg: number;
          status?: Database["public"]["Enums"]["capacity_reservation_status"];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["capacity_reservations"]["Insert"]
        >;
        Relationships: [];
      };
      payment_intents: {
        Row: {
          id: string;
          provider: string;
          provider_reference: string;
          shipment_id: string;
          payer_id: string;
          amount_cents: number;
          currency: string;
          status: Database["public"]["Enums"]["payment_status"];
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider?: string;
          provider_reference: string;
          shipment_id: string;
          payer_id: string;
          amount_cents: number;
          currency?: string;
          status?: Database["public"]["Enums"]["payment_status"];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_intents"]["Insert"]>;
        Relationships: [];
      };
      payouts: {
        Row: {
          id: string;
          beneficiary_id: string;
          shipment_id: string | null;
          amount_cents: number;
          currency: string;
          status: Database["public"]["Enums"]["payout_status"];
          scheduled_for: string | null;
          paid_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beneficiary_id: string;
          shipment_id?: string | null;
          amount_cents: number;
          currency?: string;
          status?: Database["public"]["Enums"]["payout_status"];
          scheduled_for?: string | null;
          paid_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payouts"]["Insert"]>;
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          requester_id: string;
          shipment_id: string | null;
          category: Database["public"]["Enums"]["support_category"];
          priority: Database["public"]["Enums"]["support_priority"];
          status: Database["public"]["Enums"]["support_ticket_status"];
          subject: string;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          requester_id: string;
          shipment_id?: string | null;
          category: Database["public"]["Enums"]["support_category"];
          priority?: Database["public"]["Enums"]["support_priority"];
          status?: Database["public"]["Enums"]["support_ticket_status"];
          subject: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Insert"]>;
        Relationships: [];
      };
      support_messages: {
        Row: {
          id: string;
          ticket_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_id: string;
          body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["support_messages"]["Insert"]>;
        Relationships: [];
      };
      audit_log_events: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log_events"]["Insert"]>;
        Relationships: [];
      };
      platform_metrics_daily: {
        Row: {
          metric_date: string;
          shipments_created: number;
          payments_succeeded: number;
          support_tickets_opened: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          metric_date: string;
          shipments_created?: number;
          payments_succeeded?: number;
          support_tickets_opened?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["platform_metrics_daily"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          actor_id: string | null;
          shipment_id: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          channel: Database["public"]["Enums"]["notification_channel"];
          status: Database["public"]["Enums"]["notification_status"];
          title: string;
          body: string;
          action_url: string | null;
          metadata: Json;
          scheduled_for: string | null;
          sent_at: string | null;
          read_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          actor_id?: string | null;
          shipment_id?: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          channel?: Database["public"]["Enums"]["notification_channel"];
          status?: Database["public"]["Enums"]["notification_status"];
          title: string;
          body: string;
          action_url?: string | null;
          metadata?: Json;
          scheduled_for?: string | null;
          sent_at?: string | null;
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      platform_commissions: {
        Row: {
          id: string;
          shipment_id: string;
          payment_intent_id: string | null;
          payer_id: string;
          beneficiary_id: string | null;
          currency: string;
          gross_amount_cents: number;
          commission_rate_bps: number;
          commission_amount_cents: number;
          payout_amount_cents: number;
          status: Database["public"]["Enums"]["commission_status"];
          metadata: Json;
          locked_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          payment_intent_id?: string | null;
          payer_id: string;
          beneficiary_id?: string | null;
          currency?: string;
          gross_amount_cents: number;
          commission_rate_bps?: number;
          commission_amount_cents: number;
          payout_amount_cents: number;
          status?: Database["public"]["Enums"]["commission_status"];
          metadata?: Json;
          locked_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["platform_commissions"]["Insert"]>;
        Relationships: [];
      };
      delivery_proofs: {
        Row: {
          id: string;
          shipment_id: string;
          mission_id: string | null;
          handover_qr_token_id: string | null;
          uploaded_by: string;
          proof_type: Database["public"]["Enums"]["delivery_proof_type"];
          storage_bucket: string | null;
          storage_path: string | null;
          otp_confirmed: boolean;
          recipient_name: string | null;
          recipient_phone_last4: string | null;
          captured_at: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          mission_id?: string | null;
          handover_qr_token_id?: string | null;
          uploaded_by: string;
          proof_type: Database["public"]["Enums"]["delivery_proof_type"];
          storage_bucket?: string | null;
          storage_path?: string | null;
          otp_confirmed?: boolean;
          recipient_name?: string | null;
          recipient_phone_last4?: string | null;
          captured_at?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["delivery_proofs"]["Insert"]>;
        Relationships: [];
      };
      shipment_disputes: {
        Row: {
          id: string;
          shipment_id: string;
          opened_by: string;
          assigned_to: string | null;
          category: Database["public"]["Enums"]["dispute_category"];
          status: Database["public"]["Enums"]["dispute_status"];
          subject: string;
          description: string;
          resolution: string | null;
          evidence_bucket: string | null;
          evidence_path: string | null;
          resolved_at: string | null;
          closed_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          opened_by: string;
          assigned_to?: string | null;
          category: Database["public"]["Enums"]["dispute_category"];
          status?: Database["public"]["Enums"]["dispute_status"];
          subject: string;
          description: string;
          resolution?: string | null;
          evidence_bucket?: string | null;
          evidence_path?: string | null;
          resolved_at?: string | null;
          closed_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipment_disputes"]["Insert"]>;
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
      pickup_requests: {
        Row: {
          id: string;
          shipment_id: string;
          requester_id: string;
          requested_for: string;
          status: Database["public"]["Enums"]["pickup_request_status"];
          assigned_transporter_id: string | null;
          mission_id: string | null;
          address_snapshot: Json;
          note: string | null;
          requested_at: string;
          dispatched_at: string | null;
          accepted_at: string | null;
          arrived_at: string | null;
          picked_up_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          requester_id: string;
          requested_for: string;
          status?: Database["public"]["Enums"]["pickup_request_status"];
          assigned_transporter_id?: string | null;
          mission_id?: string | null;
          address_snapshot: Json;
          note?: string | null;
          requested_at?: string;
          dispatched_at?: string | null;
          accepted_at?: string | null;
          arrived_at?: string | null;
          picked_up_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pickup_requests"]["Insert"]>;
        Relationships: [];
      };
      handover_qr_tokens: {
        Row: {
          id: string;
          token_hash: string;
          token_type: Database["public"]["Enums"]["handover_qr_token_type"];
          status: Database["public"]["Enums"]["handover_qr_token_status"];
          batch_id: string;
          trip_id: string | null;
          traveler_id: string | null;
          created_by: string | null;
          used_by: string | null;
          expires_at: string;
          used_at: string | null;
          revoked_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          token_hash: string;
          token_type: Database["public"]["Enums"]["handover_qr_token_type"];
          status?: Database["public"]["Enums"]["handover_qr_token_status"];
          batch_id: string;
          trip_id?: string | null;
          traveler_id?: string | null;
          created_by?: string | null;
          used_by?: string | null;
          expires_at: string;
          used_at?: string | null;
          revoked_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["handover_qr_tokens"]["Insert"]>;
        Relationships: [];
      };
      collection_manifests: {
        Row: {
          id: string;
          route_id: string;
          code: string;
          sealed_by: string | null;
          sealed_at: string | null;
          delivered_to_hub_at: string | null;
          incident_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          route_id: string;
          code: string;
          sealed_by?: string | null;
          sealed_at?: string | null;
          delivered_to_hub_at?: string | null;
          incident_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["collection_manifests"]["Insert"]>;
        Relationships: [];
      };
      collection_manifest_items: {
        Row: {
          id: string;
          manifest_id: string;
          shipment_id: string;
          scanned_at: string;
          incident_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          manifest_id: string;
          shipment_id: string;
          scanned_at?: string;
          incident_note?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["collection_manifest_items"]["Insert"]
        >;
        Relationships: [];
      };
      hub_package_inspections: {
        Row: {
          id: string;
          shipment_id: string;
          batch_id: string | null;
          inspector_id: string | null;
          decision: Database["public"]["Enums"]["hub_inspection_decision"];
          measured_weight_kg: number | null;
          storage_location: string | null;
          photo_path: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          batch_id?: string | null;
          inspector_id?: string | null;
          decision: Database["public"]["Enums"]["hub_inspection_decision"];
          measured_weight_kg?: number | null;
          storage_location?: string | null;
          photo_path?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["hub_package_inspections"]["Insert"]>;
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
      accept_local_delivery_mission: {
        Args: { p_mission_id: string };
        Returns: string;
      };
      create_handover_qr_token: {
        Args: {
          p_batch_id: string;
          p_expires_in_minutes?: number;
          p_token_type: Database["public"]["Enums"]["handover_qr_token_type"];
        };
        Returns: {
          expires_at: string;
          token: string;
          token_id: string;
        }[];
      };
      create_operational_shipment: {
        Args: {
          p_currency: string;
          p_delivery_address: Json;
          p_destination_city: string;
          p_destination_country: string;
          p_digital_twin: Json;
          p_estimated_price_cents: number;
          p_eta_max_days: number;
          p_eta_min_days: number;
          p_fulfillment_method?: Database["public"]["Enums"]["shipment_fulfillment_method"];
          p_latest_delivery_date: string;
          p_origin_city: string;
          p_origin_country: string;
          p_package: Json;
          p_package_photo_path?: string | null;
          p_pickup_address: Json;
          p_preferred_pickup_date: string;
          p_scope: Database["public"]["Enums"]["shipment_scope"];
          p_service_level: Database["public"]["Enums"]["shipment_service_level"];
        };
        Returns: {
          delivery_otp_code: string;
          id: string;
          scope: Database["public"]["Enums"]["shipment_scope"];
          tracking_code: string;
        }[];
      };
      dispatch_local_delivery_missions: {
        Args: {
          p_candidate_limit?: number;
          p_shipment_id: string;
        };
        Returns: {
          mission_id: string;
          score: number;
          transporter_id: string;
        }[];
      };
      create_sandbox_payment_intent: {
        Args: {
          p_amount_cents: number;
          p_currency: string;
          p_shipment_id: string;
        };
        Returns: string;
      };
      create_support_ticket: {
        Args: {
          p_category: Database["public"]["Enums"]["support_category"];
          p_initial_message: string;
          p_priority: Database["public"]["Enums"]["support_priority"];
          p_shipment_id?: string | null;
          p_subject: string;
        };
        Returns: string;
      };
      create_notification: {
        Args: {
          p_action_url?: string | null;
          p_body: string;
          p_channel?: Database["public"]["Enums"]["notification_channel"];
          p_metadata?: Json;
          p_recipient_id: string;
          p_shipment_id?: string | null;
          p_title: string;
          p_type: Database["public"]["Enums"]["notification_type"];
        };
        Returns: string;
      };
      mark_notification_read: {
        Args: { p_notification_id: string };
        Returns: string;
      };
      create_shipment_dispute: {
        Args: {
          p_category: Database["public"]["Enums"]["dispute_category"];
          p_description: string;
          p_evidence_bucket?: string | null;
          p_evidence_path?: string | null;
          p_shipment_id: string;
          p_subject: string;
        };
        Returns: string;
      };
      record_delivery_proof: {
        Args: {
          p_handover_qr_token_id?: string | null;
          p_metadata?: Json;
          p_mission_id?: string | null;
          p_otp_confirmed?: boolean;
          p_proof_type: Database["public"]["Enums"]["delivery_proof_type"];
          p_recipient_name?: string | null;
          p_recipient_phone_last4?: string | null;
          p_shipment_id: string;
          p_storage_bucket?: string | null;
          p_storage_path?: string | null;
        };
        Returns: string;
      };
      calculate_platform_commission: {
        Args: {
          p_beneficiary_id?: string | null;
          p_commission_rate_bps?: number;
          p_currency?: string;
          p_gross_amount_cents: number;
          p_payment_intent_id: string;
          p_shipment_id: string;
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
      progress_local_delivery_mission: {
        Args: {
          p_action: string;
          p_delivery_otp?: string | null;
          p_mission_id: string;
          p_proof_path?: string | null;
        };
        Returns: string;
      };
      reserve_batch_capacity: {
        Args: {
          p_batch_id: string;
          p_reserved_weight_kg: number;
          p_shipment_id: string;
        };
        Returns: string;
      };
      scan_handover_qr_token: {
        Args: {
          p_expected_token_type: Database["public"]["Enums"]["handover_qr_token_type"];
          p_incident_type?: string | null;
          p_note?: string | null;
          p_token: string;
        };
        Returns: {
          batch_id: string;
          next_token: string | null;
          next_token_expires_at: string | null;
        }[];
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
      shipment_fulfillment_method: "pickup" | "relay_dropoff";
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
      pickup_request_status:
        | "requested"
        | "dispatched"
        | "accepted"
        | "arrived"
        | "picked_up"
        | "cancelled";
      handover_qr_token_type: "origin_pickup" | "destination_dropoff";
      handover_qr_token_status: "active" | "used" | "revoked" | "expired";
      hub_inspection_decision: "accepted" | "damaged" | "missing" | "rejected";
      travel_document_status: "submitted" | "approved" | "rejected";
      hub_batch_status:
        | "open"
        | "sealed"
        | "in_transit"
        | "arrived"
        | "closed"
        | "cancelled";
      capacity_reservation_status: "reserved" | "loaded" | "released" | "cancelled";
      payment_status:
        | "requires_payment_method"
        | "requires_confirmation"
        | "succeeded"
        | "cancelled"
        | "refunded";
      payout_status: "pending" | "paid" | "failed" | "cancelled";
      support_ticket_status: "open" | "pending" | "resolved" | "closed";
      support_priority: "low" | "normal" | "high" | "urgent";
      support_category: "shipment" | "payment" | "kyc" | "damage" | "delay" | "other";
      notification_channel: "in_app" | "email" | "sms" | "whatsapp";
      notification_status: "queued" | "sent" | "read" | "failed" | "cancelled";
      notification_type:
        | "shipment_update"
        | "payment_update"
        | "mission_update"
        | "kyc_update"
        | "support_update"
        | "security_alert";
      commission_status: "calculated" | "locked" | "paid" | "cancelled";
      delivery_proof_type: "photo" | "signature" | "otp" | "qr_scan" | "document";
      dispute_status: "open" | "in_review" | "waiting_user" | "resolved" | "rejected" | "closed";
      dispute_category:
        | "lost_package"
        | "damaged_package"
        | "late_delivery"
        | "payment_issue"
        | "kyc_issue"
        | "other";
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
