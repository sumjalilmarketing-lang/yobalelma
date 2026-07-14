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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      capacity_reservations: {
        Row: {
          batch_id: string
          created_at: string
          created_by: string | null
          id: string
          reserved_weight_kg: number
          shipment_id: string
          status: Database["public"]["Enums"]["capacity_reservation_status"]
          updated_at: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          reserved_weight_kg: number
          shipment_id: string
          status?: Database["public"]["Enums"]["capacity_reservation_status"]
          updated_at?: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          reserved_weight_kg?: number
          shipment_id?: string
          status?: Database["public"]["Enums"]["capacity_reservation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capacity_reservations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "hub_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capacity_reservations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capacity_reservations_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_manifest_items: {
        Row: {
          created_at: string
          id: string
          incident_note: string | null
          manifest_id: string
          scanned_at: string
          shipment_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          incident_note?: string | null
          manifest_id: string
          scanned_at?: string
          shipment_id: string
        }
        Update: {
          created_at?: string
          id?: string
          incident_note?: string | null
          manifest_id?: string
          scanned_at?: string
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_manifest_items_manifest_id_fkey"
            columns: ["manifest_id"]
            isOneToOne: false
            referencedRelation: "collection_manifests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_manifest_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_manifests: {
        Row: {
          code: string
          created_at: string
          delivered_to_hub_at: string | null
          id: string
          incident_note: string | null
          route_id: string
          sealed_at: string | null
          sealed_by: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          delivered_to_hub_at?: string | null
          id?: string
          incident_note?: string | null
          route_id: string
          sealed_at?: string | null
          sealed_by?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          delivered_to_hub_at?: string | null
          id?: string
          incident_note?: string | null
          route_id?: string
          sealed_at?: string | null
          sealed_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_manifests_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "collection_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_manifests_sealed_by_fkey"
            columns: ["sealed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_route_stops: {
        Row: {
          arrived_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          note: string | null
          relay_point_id: string
          route_id: string
          status: Database["public"]["Enums"]["collection_stop_status"]
          stop_order: number
          updated_at: string
        }
        Insert: {
          arrived_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          relay_point_id: string
          route_id: string
          status?: Database["public"]["Enums"]["collection_stop_status"]
          stop_order: number
          updated_at?: string
        }
        Update: {
          arrived_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          relay_point_id?: string
          route_id?: string
          status?: Database["public"]["Enums"]["collection_stop_status"]
          stop_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_route_stops_relay_point_id_fkey"
            columns: ["relay_point_id"]
            isOneToOne: false
            referencedRelation: "relay_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "collection_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_routes: {
        Row: {
          created_at: string
          created_by: string | null
          driver_id: string | null
          id: string
          name: string
          route_date: string
          status: Database["public"]["Enums"]["collection_route_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          driver_id?: string | null
          id?: string
          name: string
          route_date: string
          status?: Database["public"]["Enums"]["collection_route_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          driver_id?: string | null
          id?: string
          name?: string
          route_date?: string
          status?: Database["public"]["Enums"]["collection_route_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_routes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_routes_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_proofs: {
        Row: {
          captured_at: string
          created_at: string
          handover_qr_token_id: string | null
          id: string
          metadata: Json
          mission_id: string | null
          otp_confirmed: boolean
          proof_type: Database["public"]["Enums"]["delivery_proof_type"]
          recipient_name: string | null
          recipient_phone_last4: string | null
          shipment_id: string
          storage_bucket: string | null
          storage_path: string | null
          uploaded_by: string
        }
        Insert: {
          captured_at?: string
          created_at?: string
          handover_qr_token_id?: string | null
          id?: string
          metadata?: Json
          mission_id?: string | null
          otp_confirmed?: boolean
          proof_type: Database["public"]["Enums"]["delivery_proof_type"]
          recipient_name?: string | null
          recipient_phone_last4?: string | null
          shipment_id: string
          storage_bucket?: string | null
          storage_path?: string | null
          uploaded_by: string
        }
        Update: {
          captured_at?: string
          created_at?: string
          handover_qr_token_id?: string | null
          id?: string
          metadata?: Json
          mission_id?: string | null
          otp_confirmed?: boolean
          proof_type?: Database["public"]["Enums"]["delivery_proof_type"]
          recipient_name?: string | null
          recipient_phone_last4?: string | null
          shipment_id?: string
          storage_bucket?: string | null
          storage_path?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_proofs_handover_qr_token_id_fkey"
            columns: ["handover_qr_token_id"]
            isOneToOne: false
            referencedRelation: "handover_qr_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_proofs_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "local_delivery_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_proofs_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_proofs_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_candidates: {
        Row: {
          created_at: string
          dispatch_job_id: string
          distance_km: number | null
          eta_minutes: number | null
          id: string
          mission_id: string | null
          notified_at: string | null
          rank: number
          responded_at: string | null
          score: number
          score_breakdown: Json
          status: Database["public"]["Enums"]["dispatch_candidate_status"]
          transporter_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dispatch_job_id: string
          distance_km?: number | null
          eta_minutes?: number | null
          id?: string
          mission_id?: string | null
          notified_at?: string | null
          rank: number
          responded_at?: string | null
          score?: number
          score_breakdown?: Json
          status?: Database["public"]["Enums"]["dispatch_candidate_status"]
          transporter_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dispatch_job_id?: string
          distance_km?: number | null
          eta_minutes?: number | null
          id?: string
          mission_id?: string | null
          notified_at?: string | null
          rank?: number
          responded_at?: string | null
          score?: number
          score_breakdown?: Json
          status?: Database["public"]["Enums"]["dispatch_candidate_status"]
          transporter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_candidates_dispatch_job_id_fkey"
            columns: ["dispatch_job_id"]
            isOneToOne: false
            referencedRelation: "dispatch_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_candidates_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "local_delivery_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_candidates_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_events: {
        Row: {
          actor_id: string | null
          candidate_id: string | null
          created_at: string
          dispatch_job_id: string
          event_type: string
          id: string
          message: string | null
          metadata: Json
        }
        Insert: {
          actor_id?: string | null
          candidate_id?: string | null
          created_at?: string
          dispatch_job_id: string
          event_type: string
          id?: string
          message?: string | null
          metadata?: Json
        }
        Update: {
          actor_id?: string | null
          candidate_id?: string | null
          created_at?: string
          dispatch_job_id?: string
          event_type?: string
          id?: string
          message?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_events_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "dispatch_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_events_dispatch_job_id_fkey"
            columns: ["dispatch_job_id"]
            isOneToOne: false
            referencedRelation: "dispatch_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_jobs: {
        Row: {
          assigned_at: string | null
          assigned_mission_id: string | null
          assigned_transporter_id: string | null
          candidate_limit: number
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          metadata: Json
          pickup_request_id: string | null
          search_radius_km: number
          shipment_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["dispatch_job_status"]
          timeout_seconds: number
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_mission_id?: string | null
          assigned_transporter_id?: string | null
          candidate_limit?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json
          pickup_request_id?: string | null
          search_radius_km?: number
          shipment_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["dispatch_job_status"]
          timeout_seconds?: number
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_mission_id?: string | null
          assigned_transporter_id?: string | null
          candidate_limit?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json
          pickup_request_id?: string | null
          search_radius_km?: number
          shipment_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["dispatch_job_status"]
          timeout_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_jobs_assigned_mission_id_fkey"
            columns: ["assigned_mission_id"]
            isOneToOne: false
            referencedRelation: "local_delivery_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_jobs_assigned_transporter_id_fkey"
            columns: ["assigned_transporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_jobs_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_jobs_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_qr_tokens: {
        Row: {
          batch_id: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          metadata: Json
          revoked_at: string | null
          status: Database["public"]["Enums"]["handover_qr_token_status"]
          token_hash: string
          token_type: Database["public"]["Enums"]["handover_qr_token_type"]
          traveler_id: string | null
          trip_id: string | null
          updated_at: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          metadata?: Json
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["handover_qr_token_status"]
          token_hash: string
          token_type: Database["public"]["Enums"]["handover_qr_token_type"]
          traveler_id?: string | null
          trip_id?: string | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          metadata?: Json
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["handover_qr_token_status"]
          token_hash?: string
          token_type?: Database["public"]["Enums"]["handover_qr_token_type"]
          traveler_id?: string | null
          trip_id?: string | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handover_qr_tokens_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "hub_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_qr_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_qr_tokens_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_qr_tokens_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_qr_tokens_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_batches: {
        Row: {
          anomaly_count: number
          capacity_kg: number
          code: string
          created_at: string
          created_by: string | null
          departure_date: string
          destination_city: string | null
          destination_country: string | null
          destination_hub: string
          flight_number: string | null
          handover_deadline_at: string | null
          hub_id: string | null
          id: string
          origin_hub: string
          preparation_location_id: string | null
          prepared_by: string | null
          qr_payload: Json
          ready_at: string | null
          reserved_weight_kg: number
          sealed_at: string | null
          sealed_by: string | null
          status: Database["public"]["Enums"]["hub_batch_status"]
          traveler_id: string | null
          trip_id: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          anomaly_count?: number
          capacity_kg: number
          code: string
          created_at?: string
          created_by?: string | null
          departure_date: string
          destination_city?: string | null
          destination_country?: string | null
          destination_hub: string
          flight_number?: string | null
          handover_deadline_at?: string | null
          hub_id?: string | null
          id?: string
          origin_hub: string
          preparation_location_id?: string | null
          prepared_by?: string | null
          qr_payload?: Json
          ready_at?: string | null
          reserved_weight_kg?: number
          sealed_at?: string | null
          sealed_by?: string | null
          status?: Database["public"]["Enums"]["hub_batch_status"]
          traveler_id?: string | null
          trip_id?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          anomaly_count?: number
          capacity_kg?: number
          code?: string
          created_at?: string
          created_by?: string | null
          departure_date?: string
          destination_city?: string | null
          destination_country?: string | null
          destination_hub?: string
          flight_number?: string | null
          handover_deadline_at?: string | null
          hub_id?: string | null
          id?: string
          origin_hub?: string
          preparation_location_id?: string | null
          prepared_by?: string | null
          qr_payload?: Json
          ready_at?: string | null
          reserved_weight_kg?: number
          sealed_at?: string | null
          sealed_by?: string | null
          status?: Database["public"]["Enums"]["hub_batch_status"]
          traveler_id?: string | null
          trip_id?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hub_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_batches_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "airport_hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_batches_preparation_location_id_fkey"
            columns: ["preparation_location_id"]
            isOneToOne: false
            referencedRelation: "hub_storage_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_batches_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_batches_sealed_by_fkey"
            columns: ["sealed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_batches_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_batches_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_batches_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_package_inspections: {
        Row: {
          batch_id: string | null
          created_at: string
          decision: Database["public"]["Enums"]["hub_inspection_decision"]
          id: string
          inspector_id: string | null
          measured_weight_kg: number | null
          note: string | null
          photo_path: string | null
          shipment_id: string
          storage_location: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          decision: Database["public"]["Enums"]["hub_inspection_decision"]
          id?: string
          inspector_id?: string | null
          measured_weight_kg?: number | null
          note?: string | null
          photo_path?: string | null
          shipment_id: string
          storage_location?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["hub_inspection_decision"]
          id?: string
          inspector_id?: string | null
          measured_weight_kg?: number | null
          note?: string | null
          photo_path?: string | null
          shipment_id?: string
          storage_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hub_package_inspections_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "hub_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_package_inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_package_inspections_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_verification_decisions: {
        Row: {
          actor_id: string
          comment: string | null
          created_at: string
          decision: Database["public"]["Enums"]["identity_decision"]
          id: string
          verification_id: string
        }
        Insert: {
          actor_id: string
          comment?: string | null
          created_at?: string
          decision: Database["public"]["Enums"]["identity_decision"]
          id?: string
          verification_id: string
        }
        Update: {
          actor_id?: string
          comment?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["identity_decision"]
          id?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_verification_decisions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verification_decisions_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "identity_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_verification_documents: {
        Row: {
          created_at: string
          document_kind: Database["public"]["Enums"]["identity_document_kind"]
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          profile_id: string
          storage_bucket: string
          storage_path: string
          verification_id: string
        }
        Insert: {
          created_at?: string
          document_kind: Database["public"]["Enums"]["identity_document_kind"]
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          profile_id: string
          storage_bucket?: string
          storage_path: string
          verification_id: string
        }
        Update: {
          created_at?: string
          document_kind?: Database["public"]["Enums"]["identity_document_kind"]
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          profile_id?: string
          storage_bucket?: string
          storage_path?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_verification_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verification_documents_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "identity_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_verifications: {
        Row: {
          created_at: string
          document_number: string | null
          document_type: Database["public"]["Enums"]["identity_document_type"]
          expires_on: string
          id: string
          issuing_country: string
          profile_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["identity_verification_status"]
          submitted_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type: Database["public"]["Enums"]["identity_document_type"]
          expires_on: string
          id?: string
          issuing_country: string
          profile_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["identity_verification_status"]
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["identity_document_type"]
          expires_on?: string
          id?: string
          issuing_country?: string
          profile_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["identity_verification_status"]
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      local_delivery_missions: {
        Row: {
          accepted_at: string | null
          created_at: string
          delivered_at: string | null
          id: string
          offered_at: string | null
          picked_up_at: string | null
          reason: string[]
          score: number
          shipment_id: string
          status: Database["public"]["Enums"]["local_delivery_mission_status"]
          transporter_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          offered_at?: string | null
          picked_up_at?: string | null
          reason?: string[]
          score?: number
          shipment_id: string
          status?: Database["public"]["Enums"]["local_delivery_mission_status"]
          transporter_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          offered_at?: string | null
          picked_up_at?: string | null
          reason?: string[]
          score?: number
          shipment_id?: string
          status?: Database["public"]["Enums"]["local_delivery_mission_status"]
          transporter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_delivery_missions_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_delivery_missions_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "transporter_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          actor_id: string | null
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          metadata: Json
          read_at: string | null
          recipient_id: string
          scheduled_for: string | null
          sent_at: string | null
          shipment_id: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
        }
        Insert: {
          action_url?: string | null
          actor_id?: string | null
          body: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          metadata?: Json
          read_at?: string | null
          recipient_id: string
          scheduled_for?: string | null
          sent_at?: string | null
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
        }
        Update: {
          action_url?: string | null
          actor_id?: string | null
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          metadata?: Json
          read_at?: string | null
          recipient_id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          id: string
          message: string | null
          parcel_request_id: string
          price_cents: number
          status: Database["public"]["Enums"]["offer_status"]
          traveler_id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          parcel_request_id: string
          price_cents: number
          status?: Database["public"]["Enums"]["offer_status"]
          traveler_id: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          parcel_request_id?: string
          price_cents?: number
          status?: Database["public"]["Enums"]["offer_status"]
          traveler_id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_parcel_request_id_fkey"
            columns: ["parcel_request_id"]
            isOneToOne: false
            referencedRelation: "parcel_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      parcel_requests: {
        Row: {
          created_at: string
          deadline: string
          declared_value_cents: number
          description: string
          destination_city: string
          destination_country: string
          id: string
          origin_city: string
          origin_country: string
          package_type: string
          sender_id: string
          status: Database["public"]["Enums"]["parcel_status"]
          updated_at: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          deadline: string
          declared_value_cents?: number
          description: string
          destination_city: string
          destination_country: string
          id?: string
          origin_city: string
          origin_country: string
          package_type: string
          sender_id: string
          status?: Database["public"]["Enums"]["parcel_status"]
          updated_at?: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          deadline?: string
          declared_value_cents?: number
          description?: string
          destination_city?: string
          destination_country?: string
          id?: string
          origin_city?: string
          origin_country?: string
          package_type?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["parcel_status"]
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "parcel_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          payer_id: string
          provider: string
          provider_reference: string
          shipment_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          payer_id: string
          provider?: string
          provider_reference: string
          shipment_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          payer_id?: string
          provider?: string
          provider_reference?: string
          shipment_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_intents_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_cents: number
          beneficiary_id: string
          created_at: string
          currency: string
          id: string
          metadata: Json
          paid_at: string | null
          scheduled_for: string | null
          shipment_id: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          beneficiary_id: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          scheduled_for?: string | null
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          beneficiary_id?: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          scheduled_for?: string | null
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_requests: {
        Row: {
          accepted_at: string | null
          address_snapshot: Json
          arrived_at: string | null
          assigned_transporter_id: string | null
          cancelled_at: string | null
          created_at: string
          dispatched_at: string | null
          id: string
          mission_id: string | null
          note: string | null
          picked_up_at: string | null
          requested_at: string
          requested_for: string
          requester_id: string
          shipment_id: string
          status: Database["public"]["Enums"]["pickup_request_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          address_snapshot: Json
          arrived_at?: string | null
          assigned_transporter_id?: string | null
          cancelled_at?: string | null
          created_at?: string
          dispatched_at?: string | null
          id?: string
          mission_id?: string | null
          note?: string | null
          picked_up_at?: string | null
          requested_at?: string
          requested_for: string
          requester_id: string
          shipment_id: string
          status?: Database["public"]["Enums"]["pickup_request_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          address_snapshot?: Json
          arrived_at?: string | null
          assigned_transporter_id?: string | null
          cancelled_at?: string | null
          created_at?: string
          dispatched_at?: string | null
          id?: string
          mission_id?: string | null
          note?: string | null
          picked_up_at?: string | null
          requested_at?: string
          requested_for?: string
          requester_id?: string
          shipment_id?: string
          status?: Database["public"]["Enums"]["pickup_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_requests_assigned_transporter_id_fkey"
            columns: ["assigned_transporter_id"]
            isOneToOne: false
            referencedRelation: "transporter_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "pickup_requests_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "local_delivery_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_requests_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: true
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_commissions: {
        Row: {
          beneficiary_id: string | null
          commission_amount_cents: number
          commission_rate_bps: number
          created_at: string
          currency: string
          gross_amount_cents: number
          id: string
          locked_at: string | null
          metadata: Json
          paid_at: string | null
          payer_id: string
          payment_intent_id: string | null
          payout_amount_cents: number
          shipment_id: string
          status: Database["public"]["Enums"]["commission_status"]
          updated_at: string
        }
        Insert: {
          beneficiary_id?: string | null
          commission_amount_cents: number
          commission_rate_bps?: number
          created_at?: string
          currency?: string
          gross_amount_cents: number
          id?: string
          locked_at?: string | null
          metadata?: Json
          paid_at?: string | null
          payer_id: string
          payment_intent_id?: string | null
          payout_amount_cents: number
          shipment_id: string
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Update: {
          beneficiary_id?: string | null
          commission_amount_cents?: number
          commission_rate_bps?: number
          created_at?: string
          currency?: string
          gross_amount_cents?: number
          id?: string
          locked_at?: string | null
          metadata?: Json
          paid_at?: string | null
          payer_id?: string
          payment_intent_id?: string | null
          payout_amount_cents?: number
          shipment_id?: string
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_commissions_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_commissions_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_commissions_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_commissions_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_metrics_daily: {
        Row: {
          created_at: string
          metric_date: string
          payments_succeeded: number
          shipments_created: number
          support_tickets_opened: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          metric_date: string
          payments_succeeded?: number
          shipments_created?: number
          support_tickets_opened?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          metric_date?: string
          payments_succeeded?: number
          shipments_created?: number
          support_tickets_opened?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          identity_status: Database["public"]["Enums"]["identity_verification_status"]
          is_verified: boolean
          last_sign_in_at: string | null
          phone: string | null
          postal_code: string | null
          preferred_language: string
          primary_role: Database["public"]["Enums"]["user_role"]
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          identity_status?: Database["public"]["Enums"]["identity_verification_status"]
          is_verified?: boolean
          last_sign_in_at?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_language?: string
          primary_role?: Database["public"]["Enums"]["user_role"]
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          identity_status?: Database["public"]["Enums"]["identity_verification_status"]
          is_verified?: boolean
          last_sign_in_at?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_language?: string
          primary_role?: Database["public"]["Enums"]["user_role"]
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          profile_id: string
          role_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          profile_id: string
          role_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          profile_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relay_inventory: {
        Row: {
          checked_in_at: string
          checked_out_at: string | null
          created_at: string
          current_relay_point_id: string
          id: string
          shipment_id: string
          status: Database["public"]["Enums"]["relay_inventory_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          checked_in_at?: string
          checked_out_at?: string | null
          created_at?: string
          current_relay_point_id: string
          id?: string
          shipment_id: string
          status?: Database["public"]["Enums"]["relay_inventory_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          checked_in_at?: string
          checked_out_at?: string | null
          created_at?: string
          current_relay_point_id?: string
          id?: string
          shipment_id?: string
          status?: Database["public"]["Enums"]["relay_inventory_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relay_inventory_current_relay_point_id_fkey"
            columns: ["current_relay_point_id"]
            isOneToOne: false
            referencedRelation: "relay_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relay_inventory_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: true
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relay_inventory_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relay_points: {
        Row: {
          address_line1: string
          capacity_slots: number
          city: string
          contact_name: string
          contact_phone: string
          country: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          postal_code: string | null
          status: Database["public"]["Enums"]["relay_point_status"]
          updated_at: string
        }
        Insert: {
          address_line1: string
          capacity_slots: number
          city: string
          contact_name: string
          contact_phone: string
          country: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          postal_code?: string | null
          status?: Database["public"]["Enums"]["relay_point_status"]
          updated_at?: string
        }
        Update: {
          address_line1?: string
          capacity_slots?: number
          city?: string
          contact_name?: string
          contact_phone?: string
          country?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          postal_code?: string | null
          status?: Database["public"]["Enums"]["relay_point_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relay_points_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relay_scan_events: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          note: string | null
          relay_point_id: string
          scan_type: Database["public"]["Enums"]["relay_scan_type"]
          shipment_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          note?: string | null
          relay_point_id: string
          scan_type: Database["public"]["Enums"]["relay_scan_type"]
          shipment_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          note?: string | null
          relay_point_id?: string
          scan_type?: Database["public"]["Enums"]["relay_scan_type"]
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relay_scan_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relay_scan_events_relay_point_id_fkey"
            columns: ["relay_point_id"]
            isOneToOne: false
            referencedRelation: "relay_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relay_scan_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      role_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          ends_at: string | null
          id: string
          profile_id: string
          reason: string | null
          role: Database["public"]["Enums"]["user_role"]
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          profile_id: string
          reason?: string | null
          role: Database["public"]["Enums"]["user_role"]
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          profile_id?: string
          reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          contact_email: string | null
          contact_name: string
          contact_phone: string
          country: string
          created_at: string
          id: string
          instructions: string | null
          postal_code: string | null
          shipment_id: string
          type: Database["public"]["Enums"]["shipment_address_type"]
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          contact_email?: string | null
          contact_name: string
          contact_phone: string
          country: string
          created_at?: string
          id?: string
          instructions?: string | null
          postal_code?: string | null
          shipment_id: string
          type: Database["public"]["Enums"]["shipment_address_type"]
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string
          country?: string
          created_at?: string
          id?: string
          instructions?: string | null
          postal_code?: string | null
          shipment_id?: string
          type?: Database["public"]["Enums"]["shipment_address_type"]
        }
        Relationships: [
          {
            foreignKeyName: "shipment_addresses_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_disputes: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["dispute_category"]
          closed_at: string | null
          created_at: string
          description: string
          evidence_bucket: string | null
          evidence_path: string | null
          id: string
          metadata: Json
          opened_by: string
          resolution: string | null
          resolved_at: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["dispute_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: Database["public"]["Enums"]["dispute_category"]
          closed_at?: string | null
          created_at?: string
          description: string
          evidence_bucket?: string | null
          evidence_path?: string | null
          id?: string
          metadata?: Json
          opened_by: string
          resolution?: string | null
          resolved_at?: string | null
          shipment_id: string
          status?: Database["public"]["Enums"]["dispute_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["dispute_category"]
          closed_at?: string | null
          created_at?: string
          description?: string
          evidence_bucket?: string | null
          evidence_path?: string | null
          id?: string
          metadata?: Json
          opened_by?: string
          resolution?: string | null
          resolved_at?: string | null
          shipment_id?: string
          status?: Database["public"]["Enums"]["dispute_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_disputes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_disputes_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_packages: {
        Row: {
          category: Database["public"]["Enums"]["package_category"]
          created_at: string
          declared_value_cents: number
          description: string
          fragile: boolean
          height_cm: number
          id: string
          length_cm: number
          prohibited_items_confirmed: boolean
          shipment_id: string
          title: string
          weight_kg: number
          width_cm: number
        }
        Insert: {
          category: Database["public"]["Enums"]["package_category"]
          created_at?: string
          declared_value_cents?: number
          description: string
          fragile?: boolean
          height_cm: number
          id?: string
          length_cm: number
          prohibited_items_confirmed?: boolean
          shipment_id: string
          title: string
          weight_kg: number
          width_cm: number
        }
        Update: {
          category?: Database["public"]["Enums"]["package_category"]
          created_at?: string
          declared_value_cents?: number
          description?: string
          fragile?: boolean
          height_cm?: number
          id?: string
          length_cm?: number
          prohibited_items_confirmed?: boolean
          shipment_id?: string
          title?: string
          weight_kg?: number
          width_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipment_packages_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: true
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_status_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          note: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          note?: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          note?: string | null
          shipment_id?: string
          status?: Database["public"]["Enums"]["shipment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "shipment_status_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_status_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          confirmation_accepted_at: string
          created_at: string
          currency: string
          delivery_otp_code: string | null
          delivery_otp_confirmed_at: string | null
          destination_city: string
          destination_country: string
          digital_twin: Json
          estimated_price_cents: number
          eta_max_days: number
          eta_min_days: number
          fulfillment_method: Database["public"]["Enums"]["shipment_fulfillment_method"]
          id: string
          latest_delivery_date: string
          origin_city: string
          origin_country: string
          package_photo_path: string | null
          payout_blocked_reason: string | null
          payout_eligible_for_release: boolean
          preferred_pickup_date: string
          proof_of_delivery_path: string | null
          scope: Database["public"]["Enums"]["shipment_scope"]
          sender_id: string
          service_level: Database["public"]["Enums"]["shipment_service_level"]
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_code: string
          updated_at: string
        }
        Insert: {
          confirmation_accepted_at?: string
          created_at?: string
          currency?: string
          delivery_otp_code?: string | null
          delivery_otp_confirmed_at?: string | null
          destination_city: string
          destination_country: string
          digital_twin: Json
          estimated_price_cents: number
          eta_max_days: number
          eta_min_days: number
          fulfillment_method?: Database["public"]["Enums"]["shipment_fulfillment_method"]
          id?: string
          latest_delivery_date: string
          origin_city: string
          origin_country: string
          package_photo_path?: string | null
          payout_blocked_reason?: string | null
          payout_eligible_for_release?: boolean
          preferred_pickup_date: string
          proof_of_delivery_path?: string | null
          scope: Database["public"]["Enums"]["shipment_scope"]
          sender_id: string
          service_level?: Database["public"]["Enums"]["shipment_service_level"]
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_code?: string
          updated_at?: string
        }
        Update: {
          confirmation_accepted_at?: string
          created_at?: string
          currency?: string
          delivery_otp_code?: string | null
          delivery_otp_confirmed_at?: string | null
          destination_city?: string
          destination_country?: string
          digital_twin?: Json
          estimated_price_cents?: number
          eta_max_days?: number
          eta_min_days?: number
          fulfillment_method?: Database["public"]["Enums"]["shipment_fulfillment_method"]
          id?: string
          latest_delivery_date?: string
          origin_city?: string
          origin_country?: string
          package_photo_path?: string | null
          payout_blocked_reason?: string | null
          payout_eligible_for_release?: boolean
          preferred_pickup_date?: string
          proof_of_delivery_path?: string | null
          scope?: Database["public"]["Enums"]["shipment_scope"]
          sender_id?: string
          service_level?: Database["public"]["Enums"]["shipment_service_level"]
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["support_category"]
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["support_priority"]
          requester_id: string
          resolved_at: string | null
          shipment_id: string | null
          status: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: Database["public"]["Enums"]["support_category"]
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["support_priority"]
          requester_id: string
          resolved_at?: string | null
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["support_category"]
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["support_priority"]
          requester_id?: string
          resolved_at?: string | null
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_events: {
        Row: {
          actor_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["tracking_event_type"]
          id: string
          note: string | null
          parcel_request_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["tracking_event_type"]
          id?: string
          note?: string | null
          parcel_request_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["tracking_event_type"]
          id?: string
          note?: string | null
          parcel_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_events_parcel_request_id_fkey"
            columns: ["parcel_request_id"]
            isOneToOne: false
            referencedRelation: "parcel_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      transporter_availability: {
        Row: {
          available_on: string
          created_at: string
          ends_at: string
          id: string
          profile_id: string
          starts_at: string
          status: Database["public"]["Enums"]["transporter_availability_status"]
          updated_at: string
        }
        Insert: {
          available_on: string
          created_at?: string
          ends_at: string
          id?: string
          profile_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["transporter_availability_status"]
          updated_at?: string
        }
        Update: {
          available_on?: string
          created_at?: string
          ends_at?: string
          id?: string
          profile_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["transporter_availability_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transporter_availability_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "transporter_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      transporter_locations: {
        Row: {
          accuracy_meters: number | null
          city: string
          country: string
          latitude: number | null
          longitude: number | null
          status: Database["public"]["Enums"]["transporter_availability_status"]
          transporter_id: string
          updated_at: string
        }
        Insert: {
          accuracy_meters?: number | null
          city: string
          country: string
          latitude?: number | null
          longitude?: number | null
          status?: Database["public"]["Enums"]["transporter_availability_status"]
          transporter_id: string
          updated_at?: string
        }
        Update: {
          accuracy_meters?: number | null
          city?: string
          country?: string
          latitude?: number | null
          longitude?: number | null
          status?: Database["public"]["Enums"]["transporter_availability_status"]
          transporter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transporter_locations_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transporter_matching_scores: {
        Row: {
          availability_score: number
          capacity_score: number
          created_at: string
          distance_km: number | null
          eta_minutes: number | null
          fairness_score: number
          id: string
          rating_score: number
          reasons: string[]
          score: number
          shipment_id: string
          transporter_id: string
        }
        Insert: {
          availability_score?: number
          capacity_score?: number
          created_at?: string
          distance_km?: number | null
          eta_minutes?: number | null
          fairness_score?: number
          id?: string
          rating_score?: number
          reasons?: string[]
          score?: number
          shipment_id: string
          transporter_id: string
        }
        Update: {
          availability_score?: number
          capacity_score?: number
          created_at?: string
          distance_km?: number | null
          eta_minutes?: number | null
          fairness_score?: number
          id?: string
          rating_score?: number
          reasons?: string[]
          score?: number
          shipment_id?: string
          transporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transporter_matching_scores_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transporter_matching_scores_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transporter_profiles: {
        Row: {
          base_city: string
          base_country: string
          bio: string
          business_name: string
          completed_missions: number
          created_at: string
          max_weight_kg: number
          profile_id: string
          rating: number
          status: Database["public"]["Enums"]["transporter_status"]
          updated_at: string
        }
        Insert: {
          base_city: string
          base_country: string
          bio: string
          business_name: string
          completed_missions?: number
          created_at?: string
          max_weight_kg: number
          profile_id: string
          rating?: number
          status?: Database["public"]["Enums"]["transporter_status"]
          updated_at?: string
        }
        Update: {
          base_city?: string
          base_country?: string
          bio?: string
          business_name?: string
          completed_missions?: number
          created_at?: string
          max_weight_kg?: number
          profile_id?: string
          rating?: number
          status?: Database["public"]["Enums"]["transporter_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transporter_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transporter_vehicles: {
        Row: {
          active: boolean
          capacity_kg: number
          created_at: string
          id: string
          label: string
          plate_number: string | null
          profile_id: string
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity_kg: number
          created_at?: string
          id?: string
          label: string
          plate_number?: string | null
          profile_id: string
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity_kg?: number
          created_at?: string
          id?: string
          label?: string
          plate_number?: string | null
          profile_id?: string
          type?: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transporter_vehicles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "transporter_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      transporter_zones: {
        Row: {
          active: boolean
          city: string
          country: string
          created_at: string
          id: string
          profile_id: string
          radius_km: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          city: string
          country: string
          created_at?: string
          id?: string
          profile_id: string
          radius_km: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          city?: string
          country?: string
          created_at?: string
          id?: string
          profile_id?: string
          radius_km?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transporter_zones_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "transporter_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      traveler_documents: {
        Row: {
          arrival_airport: string
          arrival_date: string
          confidence_score: number | null
          created_at: string
          departure_airport: string
          departure_date: string
          document_number: string
          extracted_payload: Json
          file_path: string
          id: string
          issuing_country: string
          manual_review_required: boolean
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["travel_document_status"]
          traveler_id: string
          traveler_name: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          arrival_airport: string
          arrival_date: string
          confidence_score?: number | null
          created_at?: string
          departure_airport: string
          departure_date: string
          document_number: string
          extracted_payload?: Json
          file_path: string
          id?: string
          issuing_country: string
          manual_review_required?: boolean
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["travel_document_status"]
          traveler_id: string
          traveler_name: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          arrival_airport?: string
          arrival_date?: string
          confidence_score?: number | null
          created_at?: string
          departure_airport?: string
          departure_date?: string
          document_number?: string
          extracted_payload?: Json
          file_path?: string
          id?: string
          issuing_country?: string
          manual_review_required?: boolean
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["travel_document_status"]
          traveler_id?: string
          traveler_name?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_documents_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          arrival_date: string
          available_weight_kg: number
          created_at: string
          departure_date: string
          destination_city: string
          destination_country: string
          id: string
          notes: string | null
          origin_city: string
          origin_country: string
          status: Database["public"]["Enums"]["trip_status"]
          traveler_id: string
          updated_at: string
        }
        Insert: {
          arrival_date: string
          available_weight_kg: number
          created_at?: string
          departure_date: string
          destination_city: string
          destination_country: string
          id?: string
          notes?: string | null
          origin_city: string
          origin_country: string
          status?: Database["public"]["Enums"]["trip_status"]
          traveler_id: string
          updated_at?: string
        }
        Update: {
          arrival_date?: string
          available_weight_kg?: number
          created_at?: string
          departure_date?: string
          destination_city?: string
          destination_country?: string
          id?: string
          notes?: string | null
          origin_city?: string
          origin_country?: string
          status?: Database["public"]["Enums"]["trip_status"]
          traveler_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_local_delivery_mission: {
        Args: { p_mission_id: string }
        Returns: string
      }
      calculate_platform_commission: {
        Args: {
          p_beneficiary_id?: string
          p_commission_rate_bps?: number
          p_currency?: string
          p_gross_amount_cents: number
          p_payment_intent_id: string
          p_shipment_id: string
        }
        Returns: string
      }
      create_handover_qr_token: {
        Args: {
          p_batch_id: string
          p_expires_in_minutes?: number
          p_token_type: Database["public"]["Enums"]["handover_qr_token_type"]
        }
        Returns: {
          expires_at: string
          token: string
          token_id: string
        }[]
      }
      create_local_delivery_mission: {
        Args: { p_shipment_id: string; p_transporter_id: string }
        Returns: string
      }
      create_notification: {
        Args: {
          p_action_url?: string
          p_body: string
          p_channel?: Database["public"]["Enums"]["notification_channel"]
          p_metadata?: Json
          p_recipient_id: string
          p_shipment_id?: string
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: string
      }
      create_operational_shipment: {
        Args: {
          p_currency: string
          p_delivery_address: Json
          p_destination_city: string
          p_destination_country: string
          p_digital_twin: Json
          p_estimated_price_cents: number
          p_eta_max_days: number
          p_eta_min_days: number
          p_fulfillment_method?: Database["public"]["Enums"]["shipment_fulfillment_method"]
          p_latest_delivery_date: string
          p_origin_city: string
          p_origin_country: string
          p_package: Json
          p_package_photo_path?: string
          p_pickup_address: Json
          p_preferred_pickup_date: string
          p_scope: Database["public"]["Enums"]["shipment_scope"]
          p_service_level: Database["public"]["Enums"]["shipment_service_level"]
        }
        Returns: {
          delivery_otp_code: string
          id: string
          scope: Database["public"]["Enums"]["shipment_scope"]
          tracking_code: string
        }[]
      }
      create_sandbox_payment_intent: {
        Args: {
          p_amount_cents: number
          p_currency: string
          p_shipment_id: string
        }
        Returns: string
      }
      create_shipment: {
        Args: {
          p_currency: string
          p_delivery_address: Json
          p_destination_city: string
          p_destination_country: string
          p_digital_twin: Json
          p_estimated_price_cents: number
          p_eta_max_days: number
          p_eta_min_days: number
          p_latest_delivery_date: string
          p_origin_city: string
          p_origin_country: string
          p_package: Json
          p_pickup_address: Json
          p_preferred_pickup_date: string
          p_scope: Database["public"]["Enums"]["shipment_scope"]
          p_service_level: Database["public"]["Enums"]["shipment_service_level"]
        }
        Returns: {
          id: string
          tracking_code: string
        }[]
      }
      create_shipment_dispute: {
        Args: {
          p_category: Database["public"]["Enums"]["dispute_category"]
          p_description: string
          p_evidence_bucket?: string
          p_evidence_path?: string
          p_shipment_id: string
          p_subject: string
        }
        Returns: string
      }
      create_support_ticket: {
        Args: {
          p_category: Database["public"]["Enums"]["support_category"]
          p_initial_message: string
          p_priority: Database["public"]["Enums"]["support_priority"]
          p_shipment_id?: string
          p_subject: string
        }
        Returns: string
      }
      current_user_has_role: {
        Args: { required_roles: string[] }
        Returns: boolean
      }
      dispatch_local_delivery_missions: {
        Args: { p_candidate_limit?: number; p_shipment_id: string }
        Returns: {
          mission_id: string
          score: number
          transporter_id: string
        }[]
      }
      find_local_transporter_matches: {
        Args: { p_shipment_id: string }
        Returns: {
          business_name: string
          reason: string[]
          score: number
          transporter_id: string
        }[]
      }
      generate_tracking_code: { Args: never; Returns: string }
      hash_handover_token: { Args: { p_token: string }; Returns: string }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: string
      }
      progress_local_delivery_mission: {
        Args: {
          p_action: string
          p_delivery_otp?: string
          p_mission_id: string
          p_proof_path?: string
        }
        Returns: string
      }
      record_delivery_proof: {
        Args: {
          p_handover_qr_token_id?: string
          p_metadata?: Json
          p_mission_id?: string
          p_otp_confirmed?: boolean
          p_proof_type: Database["public"]["Enums"]["delivery_proof_type"]
          p_recipient_name?: string
          p_recipient_phone_last4?: string
          p_shipment_id: string
          p_storage_bucket?: string
          p_storage_path?: string
        }
        Returns: string
      }
      record_relay_scan: {
        Args: {
          p_note?: string
          p_relay_point_id: string
          p_scan_type: Database["public"]["Enums"]["relay_scan_type"]
          p_tracking_code: string
        }
        Returns: string
      }
      reserve_batch_capacity: {
        Args: {
          p_batch_id: string
          p_reserved_weight_kg: number
          p_shipment_id: string
        }
        Returns: string
      }
      scan_handover_qr_token: {
        Args: {
          p_expected_token_type: Database["public"]["Enums"]["handover_qr_token_type"]
          p_incident_type?: string
          p_note?: string
          p_token: string
        }
        Returns: {
          batch_id: string
          next_token: string
          next_token_expires_at: string
        }[]
      }
    }
    Enums: {
      account_status:
        | "pending_email_confirmation"
        | "active"
        | "suspended"
        | "closed"
      capacity_reservation_status:
        | "reserved"
        | "loaded"
        | "released"
        | "cancelled"
      collection_route_status:
        | "planned"
        | "in_progress"
        | "completed"
        | "cancelled"
      collection_stop_status: "pending" | "arrived" | "completed" | "skipped"
      commission_status: "calculated" | "locked" | "paid" | "cancelled"
      delivery_proof_type:
        | "photo"
        | "signature"
        | "otp"
        | "qr_scan"
        | "document"
      dispatch_candidate_status:
        | "pending"
        | "notified"
        | "accepted"
        | "declined"
        | "expired"
        | "superseded"
      dispatch_job_status:
        | "queued"
        | "broadcasting"
        | "assigned"
        | "expired"
        | "cancelled"
        | "manual_review"
      dispute_category:
        | "lost_package"
        | "damaged_package"
        | "late_delivery"
        | "payment_issue"
        | "kyc_issue"
        | "other"
      dispute_status:
        | "open"
        | "in_review"
        | "waiting_user"
        | "resolved"
        | "rejected"
        | "closed"
      handover_qr_token_status: "active" | "used" | "revoked" | "expired"
      handover_qr_token_type: "origin_pickup" | "destination_dropoff"
      hub_batch_status:
        | "open"
        | "sealed"
        | "in_transit"
        | "arrived"
        | "closed"
        | "cancelled"
      hub_inspection_decision: "accepted" | "damaged" | "missing" | "rejected"
      identity_decision:
        | "submitted"
        | "approved"
        | "rejected"
        | "needs_more_information"
      identity_document_kind: "front" | "back" | "selfie" | "passport"
      identity_document_type:
        | "national_id"
        | "passport"
        | "residence_permit"
        | "driver_license"
      identity_verification_status:
        | "pending"
        | "submitted"
        | "approved"
        | "rejected"
        | "needs_more_information"
        | "expired"
      local_delivery_mission_status:
        | "suggested"
        | "offered"
        | "accepted"
        | "picked_up"
        | "delivered"
        | "cancelled"
      notification_channel: "in_app" | "email" | "sms" | "whatsapp"
      notification_status: "queued" | "sent" | "read" | "failed" | "cancelled"
      notification_type:
        | "shipment_update"
        | "payment_update"
        | "mission_update"
        | "kyc_update"
        | "support_update"
        | "security_alert"
      offer_status: "pending" | "accepted" | "declined" | "cancelled"
      package_category:
        | "documents"
        | "clothing"
        | "electronics"
        | "food_dry"
        | "cosmetics"
        | "other"
      parcel_status:
        | "draft"
        | "open"
        | "matched"
        | "in_transit"
        | "delivered"
        | "cancelled"
      payment_status:
        | "requires_payment_method"
        | "requires_confirmation"
        | "succeeded"
        | "cancelled"
        | "refunded"
      payout_status: "pending" | "paid" | "failed" | "cancelled"
      pickup_request_status:
        | "requested"
        | "dispatched"
        | "accepted"
        | "arrived"
        | "picked_up"
        | "cancelled"
      relay_inventory_status: "stored" | "released" | "exception"
      relay_point_status: "active" | "inactive" | "suspended"
      relay_scan_type: "check_in" | "check_out" | "handover" | "exception"
      shipment_address_type: "pickup" | "delivery"
      shipment_fulfillment_method: "pickup" | "relay_dropoff"
      shipment_scope: "national" | "international"
      shipment_service_level: "standard" | "express"
      shipment_status:
        | "confirmed"
        | "matching"
        | "assigned"
        | "picked_up"
        | "at_relay"
        | "collected_for_hub"
        | "in_transit"
        | "at_hub"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
      support_category:
        | "shipment"
        | "payment"
        | "kyc"
        | "damage"
        | "delay"
        | "other"
      support_priority: "low" | "normal" | "high" | "urgent"
      support_ticket_status: "open" | "pending" | "resolved" | "closed"
      tracking_event_type:
        | "created"
        | "matched"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "cancelled"
      transporter_availability_status: "available" | "booked" | "offline"
      transporter_status: "pending" | "active" | "suspended"
      travel_document_status: "submitted" | "approved" | "rejected"
      trip_status: "planned" | "boarding" | "arrived" | "cancelled"
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
        | "super_admin"
      vehicle_type: "bike" | "scooter" | "car" | "van" | "truck"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: [
        "pending_email_confirmation",
        "active",
        "suspended",
        "closed",
      ],
      capacity_reservation_status: [
        "reserved",
        "loaded",
        "released",
        "cancelled",
      ],
      collection_route_status: [
        "planned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      collection_stop_status: ["pending", "arrived", "completed", "skipped"],
      commission_status: ["calculated", "locked", "paid", "cancelled"],
      delivery_proof_type: ["photo", "signature", "otp", "qr_scan", "document"],
      dispatch_candidate_status: [
        "pending",
        "notified",
        "accepted",
        "declined",
        "expired",
        "superseded",
      ],
      dispatch_job_status: [
        "queued",
        "broadcasting",
        "assigned",
        "expired",
        "cancelled",
        "manual_review",
      ],
      dispute_category: [
        "lost_package",
        "damaged_package",
        "late_delivery",
        "payment_issue",
        "kyc_issue",
        "other",
      ],
      dispute_status: [
        "open",
        "in_review",
        "waiting_user",
        "resolved",
        "rejected",
        "closed",
      ],
      handover_qr_token_status: ["active", "used", "revoked", "expired"],
      handover_qr_token_type: ["origin_pickup", "destination_dropoff"],
      hub_batch_status: [
        "open",
        "sealed",
        "in_transit",
        "arrived",
        "closed",
        "cancelled",
      ],
      hub_inspection_decision: ["accepted", "damaged", "missing", "rejected"],
      identity_decision: [
        "submitted",
        "approved",
        "rejected",
        "needs_more_information",
      ],
      identity_document_kind: ["front", "back", "selfie", "passport"],
      identity_document_type: [
        "national_id",
        "passport",
        "residence_permit",
        "driver_license",
      ],
      identity_verification_status: [
        "pending",
        "submitted",
        "approved",
        "rejected",
        "needs_more_information",
        "expired",
      ],
      local_delivery_mission_status: [
        "suggested",
        "offered",
        "accepted",
        "picked_up",
        "delivered",
        "cancelled",
      ],
      notification_channel: ["in_app", "email", "sms", "whatsapp"],
      notification_status: ["queued", "sent", "read", "failed", "cancelled"],
      notification_type: [
        "shipment_update",
        "payment_update",
        "mission_update",
        "kyc_update",
        "support_update",
        "security_alert",
      ],
      offer_status: ["pending", "accepted", "declined", "cancelled"],
      package_category: [
        "documents",
        "clothing",
        "electronics",
        "food_dry",
        "cosmetics",
        "other",
      ],
      parcel_status: [
        "draft",
        "open",
        "matched",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      payment_status: [
        "requires_payment_method",
        "requires_confirmation",
        "succeeded",
        "cancelled",
        "refunded",
      ],
      payout_status: ["pending", "paid", "failed", "cancelled"],
      pickup_request_status: [
        "requested",
        "dispatched",
        "accepted",
        "arrived",
        "picked_up",
        "cancelled",
      ],
      relay_inventory_status: ["stored", "released", "exception"],
      relay_point_status: ["active", "inactive", "suspended"],
      relay_scan_type: ["check_in", "check_out", "handover", "exception"],
      shipment_address_type: ["pickup", "delivery"],
      shipment_fulfillment_method: ["pickup", "relay_dropoff"],
      shipment_scope: ["national", "international"],
      shipment_service_level: ["standard", "express"],
      shipment_status: [
        "confirmed",
        "matching",
        "assigned",
        "picked_up",
        "at_relay",
        "collected_for_hub",
        "in_transit",
        "at_hub",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      support_category: [
        "shipment",
        "payment",
        "kyc",
        "damage",
        "delay",
        "other",
      ],
      support_priority: ["low", "normal", "high", "urgent"],
      support_ticket_status: ["open", "pending", "resolved", "closed"],
      tracking_event_type: [
        "created",
        "matched",
        "picked_up",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      transporter_availability_status: ["available", "booked", "offline"],
      transporter_status: ["pending", "active", "suspended"],
      travel_document_status: ["submitted", "approved", "rejected"],
      trip_status: ["planned", "boarding", "arrived", "cancelled"],
      user_role: [
        "sender",
        "traveler",
        "both",
        "admin",
        "client",
        "local_transporter",
        "relay_agent",
        "hub_agent",
        "collection_driver",
        "operations_manager",
        "support_agent",
        "super_admin",
      ],
      vehicle_type: ["bike", "scooter", "car", "van", "truck"],
    },
  },
} as const
