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
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          password_hash: string | null;
          user_type: "b2b" | "b2c" | "admin";
          company_id: string | null;
          avatar_url: string | null;
          is_demo_user: boolean;
          failed_login_attempts: number | null;
          locked_until: string | null;
          deleted_by: number;
          is_deleted: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          password_hash?: string | null;
          user_type?: "b2b" | "b2c" | "admin";
          company_id?: string | null;
          avatar_url?: string | null;
          is_demo_user?: boolean;
          failed_login_attempts?: number | null;
          locked_until?: string | null;
          deleted_by?: number;
          is_deleted?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          password_hash?: string | null;
          user_type?: "b2b" | "b2c" | "admin";
          company_id?: string | null;
          avatar_url?: string | null;
          is_demo_user?: boolean;
          failed_login_attempts?: number | null;
          locked_until?: string | null;
          deleted_by?: number;
          is_deleted?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          business_type: "shop_online" | "brand" | "factory" | null;
          current_plan: "starter" | "standard" | "export";
          target_markets: string[] | null;
          deleted_by: number;
          is_deleted: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          business_type?: "shop_online" | "brand" | "factory" | null;
          current_plan?: "starter" | "standard" | "export";
          target_markets?: string[] | null;
          deleted_by?: number;
          is_deleted?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          business_type?: "shop_online" | "brand" | "factory" | null;
          current_plan?: "starter" | "standard" | "export";
          target_markets?: string[] | null;
          deleted_by?: number;
          is_deleted?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
