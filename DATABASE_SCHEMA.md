CREATE TYPE user_role AS ENUM ('b2b', 'b2c', 'admin');
CREATE TYPE business_type AS ENUM ('shop_online', 'brand', 'factory');
CREATE TYPE pricing_plan AS ENUM ('starter', 'standard', 'export');

CREATE TABLE IF NOT EXISTS companies (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name VARCHAR(255) NOT NULL,

business_type business_type_enum,
current_plan pricing_plan NOT NULL DEFAULT 'starter',
target_markets TEXT[],

deleted_by INT NOT NULL DEFAULT 0,
is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
deleted_at TIMESTAMP NULL,

created_at TIMESTAMP NOT NULL DEFAULT now(),
updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
email VARCHAR(255) NOT NULL UNIQUE,
full_name VARCHAR(255) NOT NULL,
password_hash VARCHAR(255),
user_type user_role DEFAULT 'b2c',
company_id UUID DEFAULT NULL REFERENCES companies(id),
avatar_url VARCHAR(255) DEFAULT NULL,
is_demo_user BOOLEAN DEFAULT TRUE,
failed_login_attempts INT,
locked_until TIMESTAMP NULL,
  
 deleted_by INT NOT NULL DEFAULT 0,
is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
deleted_at TIMESTAMP NULL,
created_at TIMESTAMP NOT NULL DEFAULT now(),
updated_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
