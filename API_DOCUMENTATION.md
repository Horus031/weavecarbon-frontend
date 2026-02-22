# WeaveCarbon API Documentation

## Tổng Quan

WeaveCarbon Backend API cung cấp các endpoints để quản lý carbon footprint cho doanh nghiệp thời trang và người dùng cá nhân.

**Base URL**: `http://localhost:4000/api`

**Authentication**: Bearer Token (JWT)

---

## Mục Lục

1. [Authentication APIs](#1-authentication-apis)
2. [Account APIs](#2-account-apis)
3. [Dashboard APIs](#3-dashboard-apis)
4. [Products APIs](#4-products-apis)
5. [Product Batches APIs](#5-product-batches-apis)
6. [Logistics APIs](#6-logistics-apis)
7. [Company Members APIs](#7-company-members-apis)
8. [Reports & Export Compliance APIs](#8-reports--export-compliance-apis)
9. [Subscription APIs](#9-subscription-apis)
10. [Error Codes](#10-error-codes)

---

## 1. Authentication APIs

Base path: `/api/auth`

### 1.1. Đăng Ký (Signup)

**Endpoint**: `POST /api/auth/signup`

**Mô tả**: Đăng ký tài khoản mới (B2B hoặc B2C)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "full_name": "Nguyễn Văn A",
  "role": "b2b",
  "company_name": "Green Fashion Co.",
  "business_type": "brand",
  "target_markets": ["VN", "US", "EU"],
  "phone": "0901234567"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "email_verified": false
    },
    "profile": {
      "id": "uuid",
      "user_id": "uuid",
      "company_id": "uuid"
    },
    "role": "b2b",
    "company": {
      "id": "uuid",
      "name": "Green Fashion Co.",
      "business_type": "brand"
    },
    "requires_email_verification": true
  }
}
```

**Validation Rules**:
- `email`: Required, valid email format
- `password`: Min 8 characters, must include uppercase, lowercase, number, special char
- `full_name`: Required, 2-100 characters
- `role`: Required, enum ['b2b', 'b2c']
- `company_name`: Required for B2B
- `business_type`: Required for B2B, enum ['shop_online', 'brand', 'factory']
- `target_markets`: Optional array of country codes

**Rate Limit**: 10 requests per 15 minutes per IP

---

### 1.2. Đăng Nhập (Signin)

**Endpoint**: `POST /api/auth/signin`

**Mô tả**: Đăng nhập và nhận access token

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "remember_me": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "email_verified": true
    },
    "profile": {
      "id": "uuid",
      "company_id": "uuid",
      "is_demo_user": false
    },
    "roles": ["b2b"],
    "company": {
      "id": "uuid",
      "name": "Green Fashion Co.",
      "business_type": "brand",
      "current_plan": "starter",
      "target_markets": ["VN", "US"]
    },
    "company_membership": {
      "company_id": "uuid",
      "role": "admin",
      "status": "active",
      "is_root": true
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer",
      "expires_in": 900,
      "expires_at": "2026-02-20T10:00:00.000Z"
    }
  }
}
```

**Error Responses**:
- `401`: Invalid credentials
- `403`: Email not verified

**Rate Limit**: 5 requests per 15 minutes per IP

---

### 1.3. Làm Mới Token (Refresh Token)

**Endpoint**: `POST /api/auth/refresh`

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "tokens": {
      "access_token": "new_access_token",
      "refresh_token": "new_refresh_token",
      "token_type": "Bearer",
      "expires_in": 900,
      "expires_at": "2026-02-20T10:15:00.000Z"
    }
  }
}
```

---

### 1.4. Đăng Xuất (Signout)

**Endpoint**: `POST /api/auth/signout`

**Authentication**: Required

**Request Body**:
```json
{
  "all_devices": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "sessions_revoked": 1,
    "all_devices": false
  }
}
```

---

### 1.5. Tài Khoản Demo

**Endpoint**: `POST /api/auth/demo`

**Mô tả**: Tạo tài khoản demo để dùng thử

**Request Body**:
```json
{
  "role": "b2b",
  "demo_scenario": "sample_data"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "demo_*@weavecarbon.com",
      "is_demo": true,
      "demo_expires_at": "2026-02-21T10:00:00.000Z"
    },
    "company": {
      "id": "uuid",
      "name": "Demo Company"
    },
    "tokens": {
      "access_token": "...",
      "refresh_token": "..."
    },
    "limitations": {
      "max_products": 10,
      "max_calculations": 50,
      "export_disabled": true,
      "session_duration_hours": 24
    }
  }
}
```

---

### 1.6. Xác Thực Email

**Endpoint GET**: `GET /api/auth/verify-email?token={token}&email={email}`

**Endpoint POST**: `POST /api/auth/verify-email`

**Request Body** (POST):
```json
{
  "token": "verification_token",
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully",
    "tokens": {
      "access_token": "...",
      "refresh_token": "..."
    }
  }
}
```

---

### 1.7. Gửi Lại Email Xác Thực

**Endpoint**: `POST /api/auth/verify-email/resend`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Verification email sent"
  }
}
```

---

### 1.8. Đăng Nhập Google (OAuth)

**Endpoint**: `GET /api/auth/google?intent=signin&role=b2b`

**Mô tả**: Khởi tạo Google OAuth flow

**Query Parameters**:
- `intent`: 'signin' hoặc 'signup' (default: 'signin')
- `role`: 'b2b' hoặc 'b2c' (default: 'b2b' for signup)

**Response**: Redirect to Google OAuth

---

### 1.9. Google Callback

**Endpoint**: `GET /api/auth/google/callback`

**Mô tả**: Xử lý callback từ Google OAuth

**Response**: Redirect to frontend với token trong URL hash

---

### 1.10. Kiểm Tra Company

**Endpoint**: `GET /api/auth/check-company`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "has_company": true,
    "is_b2b": true,
    "company_id": "uuid"
  }
}
```

---

## 2. Account APIs

Base path: `/api/account`

**Authentication**: Required for all endpoints

---

### 2.1. Lấy Thông Tin Tài Khoản

**Endpoint**: `GET /api/account`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "avatar_url": null,
      "email_verified": true
    },
    "profile": {
      "id": "uuid",
      "user_id": "uuid",
      "company_id": "uuid"
    },
    "roles": ["b2b"],
    "company": {
      "id": "uuid",
      "name": "Green Fashion Co.",
      "business_type": "brand",
      "current_plan": "starter",
      "target_markets": ["VN", "US"]
    },
    "company_membership": {
      "company_id": "uuid",
      "role": "admin",
      "status": "active",
      "is_root": true
    }
  }
}
```

---

### 2.2. Cập Nhật Profile

**Endpoint**: `PUT /api/account/profile`

**Request Body**:
```json
{
  "full_name": "Nguyễn Văn B",
  "email": "newmail@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "email": "newmail@example.com",
    "full_name": "Nguyễn Văn B",
    "updated_at": "2026-02-20T10:00:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

---

### 2.3. Tạo Company (cho user chưa có company)

**Endpoint**: `POST /api/account/company`

**Request Body**:
```json
{
  "name": "My New Company",
  "business_type": "brand",
  "target_markets": ["VN", "TH"]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My New Company",
    "business_type": "brand",
    "current_plan": "starter",
    "target_markets": ["VN", "TH"]
  },
  "message": "Company created successfully"
}
```

---

### 2.4. Cập Nhật Company

**Endpoint**: `PUT /api/account/company`

**Authorization**: Company Admin only

**Request Body**:
```json
{
  "name": "Updated Company Name",
  "business_type": "factory"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Company Name",
    "business_type": "factory",
    "updated_at": "2026-02-20T10:00:00.000Z"
  },
  "message": "Company updated successfully"
}
```

---

### 2.5. Đổi Mật Khẩu

**Endpoint**: `POST /api/account/change-password`

**Request Body**:
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

---

## 3. Dashboard APIs

Base path: `/api/dashboard`

**Authentication**: Required (B2B role only)

---

### 3.1. Dashboard Tổng Quan

**Endpoint**: `GET /api/dashboard/overview`

**Query Parameters**:
- `trend_months`: Number (1-12, default: 6) - Số tháng hiển thị xu hướng carbon

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_co2e": 12540.50,
      "total_skus": 156,
      "avg_export_readiness": 82.75,
      "data_confidence": 88.5
    },
    "carbon_trend": [
      {
        "month": "2025-08",
        "label": "T8",
        "actual_emissions": 1620.00,
        "target_emissions": 1500.00
      },
      {
        "month": "2025-09",
        "label": "T9",
        "actual_emissions": 1480.00,
        "target_emissions": 1450.00
      }
    ],
    "emission_breakdown": [
      {
        "category": "materials",
        "label": "Vật liệu",
        "percentage": 45,
        "co2e": 5643.23,
        "color": "hsl(var(--primary))"
      },
      {
        "category": "production",
        "label": "Sản xuất",
        "percentage": 30,
        "co2e": 3762.15,
        "color": "hsl(var(--accent))"
      },
      {
        "category": "transport",
        "label": "Vận chuyển",
        "percentage": 20,
        "co2e": 2508.10,
        "color": "hsl(150, 40%, 50%)"
      },
      {
        "category": "packaging",
        "label": "Đóng gói",
        "percentage": 5,
        "co2e": 627.02,
        "color": "hsl(35, 50%, 60%)"
      }
    ],
    "market_readiness": [
      {
        "market_code": "EU",
        "market_name": "European Union",
        "score": 85.50,
        "status": "good",
        "requirements_met": [
          "Product carbon footprint calculated",
          "GOTS certified materials"
        ],
        "requirements_missing": [
          "Digital Product Passport ready"
        ]
      }
    ],
    "recommendations": [
      {
        "id": "uuid",
        "title": "Tối ưu nguyên liệu",
        "description": "Switch to recycled polyester blend (20%)",
        "impact_level": "high",
        "reduction_percentage": 15.20,
        "estimated_cost_savings": 2400.00,
        "category": "materials",
        "product_id": "uuid"
      }
    ]
  },
  "meta": {
    "company_id": "uuid",
    "generated_at": "2026-02-20T10:00:00.000Z",
    "trend_period_months": 6
  }
}
```

---

## 4. Products APIs

Base path: `/api/products`

**Authentication**: Required (B2B role only)

---

### 4.1. Danh Sách Sản Phẩm

**Endpoint**: `GET /api/products`

**Query Parameters**:
- `search`: String - Tìm theo tên hoặc SKU
- `status`: Enum ['draft', 'active', 'archived']
- `category`: String - Lọc theo category
- `page`: Number (default: 1)
- `page_size`: Number (default: 20, max: 100)
- `sort_by`: String (default: 'updated_at')
- `sort_order`: Enum ['asc', 'desc'] (default: 'desc')
- `include`: Comma-separated fields to include (e.g., 'materials,suppliers')

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "company_id": "uuid",
        "sku": "GF-TSHIRT-001",
        "name": "Organic Cotton T-Shirt - White",
        "category": "apparel",
        "weight_kg": 0.18,
        "status": "active",
        "total_co2e": 0.95,
        "materials_co2e": 0.52,
        "production_co2e": 0.30,
        "transport_co2e": 0.08,
        "packaging_co2e": 0.05,
        "data_confidence_score": 92.5,
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-02-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 156,
      "total_pages": 8
    }
  }
}
```

---

### 4.2. Chi Tiết Sản Phẩm

**Endpoint**: `GET /api/products/:id`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "company_id": "uuid",
    "sku": "GF-TSHIRT-001",
    "name": "Organic Cotton T-Shirt - White",
    "category": "apparel",
    "description": "100% organic cotton t-shirt",
    "weight_kg": 0.18,
    "status": "active",
    "total_co2e": 0.95,
    "materials_co2e": 0.52,
    "production_co2e": 0.30,
    "transport_co2e": 0.08,
    "packaging_co2e": 0.05,
    "data_confidence_score": 92.5,
    "materials": [
      {
        "material_id": "uuid",
        "material_name": "Organic Cotton",
        "supplier_id": "uuid",
        "supplier_name": "Green Textile Mills",
        "percentage": 100.00,
        "weight_kg": 0.18,
        "co2e_contribution": 0.52
      }
    ],
    "production_steps": [],
    "transport_details": {},
    "packaging_details": {},
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 4.3. Tạo Sản Phẩm Mới

**Endpoint**: `POST /api/products`

**Request Body**:
```json
{
  "sku": "GF-TSHIRT-002",
  "name": "Organic Cotton T-Shirt - Black",
  "category": "apparel",
  "description": "Black organic cotton t-shirt",
  "weight_kg": 0.18,
  "status": "draft",
  "materials": [
    {
      "material_id": "uuid",
      "supplier_id": "uuid",
      "percentage": 100,
      "weight_kg": 0.18
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "GF-TSHIRT-002",
    "name": "Organic Cotton T-Shirt - Black",
    "status": "draft",
    "total_co2e": 0.95,
    "created_at": "2026-02-20T10:00:00.000Z"
  }
}
```

---

### 4.4. Cập Nhật Sản Phẩm

**Endpoint**: `PUT /api/products/:id`

**Request Body**:
```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "weight_kg": 0.20,
  "materials": [
    {
      "material_id": "uuid",
      "supplier_id": "uuid",
      "percentage": 80,
      "weight_kg": 0.16
    },
    {
      "material_id": "uuid2",
      "supplier_id": "uuid2",
      "percentage": 20,
      "weight_kg": 0.04
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Product Name",
    "total_co2e": 1.05,
    "updated_at": "2026-02-20T10:00:00.000Z"
  }
}
```

---

### 4.5. Cập Nhật Trạng Thái Sản Phẩm

**Endpoint**: `PATCH /api/products/:id/status`

**Request Body**:
```json
{
  "status": "active"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "active",
    "updated_at": "2026-02-20T10:00:00.000Z"
  }
}
```

---

### 4.6. Xóa Sản Phẩm (Soft Delete)

**Endpoint**: `DELETE /api/products/:id`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Product archived successfully"
}
```

---

### 4.7. Import Hàng Loạt (Bulk Import)

**Endpoint**: `POST /api/products/bulk-import`

**Request Body**:
```json
{
  "save_mode": "draft",
  "rows": [
    {
      "sku": "PRODUCT-001",
      "name": "Product Name",
      "category": "apparel",
      "weight_kg": 0.5,
      "materials": []
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total": 10,
    "imported": 8,
    "failed": 2,
    "errors": [
      {
        "row": 3,
        "error": "Duplicate SKU"
      }
    ]
  }
}
```

---

### 4.8. Tải Template Import

**Endpoint**: `GET /api/products/bulk-template?format=xlsx`

**Query Parameters**:
- `format`: 'xlsx' hoặc 'csv' (default: 'xlsx')

**Response**: File download (Excel/CSV)

---

### 4.9. Validate Import Data

**Endpoint**: `POST /api/products/bulk-import/validate`

**Request Body**:
```json
{
  "rows": [
    {
      "sku": "PRODUCT-001",
      "name": "Product Name",
      "category": "apparel",
      "weight_kg": 0.5
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "totalRows": 10,
    "validCount": 8,
    "errorCount": 2,
    "warningCount": 0,
    "validRows": [],
    "invalidRows": [
      {
        "row": 3,
        "errors": ["SKU already exists"]
      }
    ],
    "warnings": []
  }
}
```

---

## 5. Product Batches APIs

Base path: `/api/product-batches`

**Authentication**: Required (B2B role only)

---

### 5.1. Danh Sách Batches

**Endpoint**: `GET /api/product-batches`

**Query Parameters**:
- `search`: String - Tìm theo tên batch
- `status`: Enum ['draft', 'published', 'archived']
- `page`: Number (default: 1)
- `page_size`: Number (default: 20)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "batch_name": "Spring 2026 Collection - US",
        "description": "T-shirts and hoodies for US market",
        "status": "published",
        "destination_market": "US",
        "transport_modes": ["road", "sea"],
        "total_products": 2,
        "total_quantity": 1900,
        "total_weight_kg": 478.00,
        "total_co2e": 143.40,
        "published_at": "2026-02-15T00:00:00.000Z",
        "created_at": "2026-02-10T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 15,
      "total_pages": 1
    }
  }
}
```

---

### 5.2. Chi Tiết Batch

**Endpoint**: `GET /api/product-batches/:id`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "batch_name": "Spring 2026 Collection - US",
    "description": "T-shirts and hoodies for US market",
    "status": "published",
    "destination_market": "US",
    "transport_modes": ["road", "sea"],
    "shipment_id": "uuid",
    "total_products": 2,
    "total_quantity": 1900,
    "total_weight_kg": 478.00,
    "total_co2e": 143.40,
    "items": [
      {
        "product_id": "uuid",
        "sku": "GF-TSHIRT-001",
        "product_name": "Organic Cotton T-Shirt - White",
        "quantity": 1500,
        "weight_kg": 270.00,
        "co2_per_unit": 0.95
      }
    ],
    "published_at": "2026-02-15T00:00:00.000Z",
    "created_by": "uuid",
    "created_at": "2026-02-10T00:00:00.000Z"
  }
}
```

---

### 5.3. Tạo Batch Mới

**Endpoint**: `POST /api/product-batches`

**Request Body**:
```json
{
  "batch_name": "Summer 2026 Collection",
  "description": "Summer collection for EU market",
  "destination_market": "EU",
  "transport_modes": ["sea", "road"]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "batch_name": "Summer 2026 Collection",
    "status": "draft",
    "created_at": "2026-02-20T10:00:00.000Z"
  }
}
```

---

### 5.4. Cập Nhật Batch

**Endpoint**: `PATCH /api/product-batches/:id`

**Request Body**:
```json
{
  "batch_name": "Updated Batch Name",
  "description": "Updated description",
  "destination_market": "JP"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "batch_name": "Updated Batch Name",
    "updated_at": "2026-02-20T10:00:00.000Z"
  }
}
```

---

### 5.5. Xóa Batch

**Endpoint**: `DELETE /api/product-batches/:id`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Batch archived successfully"
}
```

---

### 5.6. Thêm Sản Phẩm Vào Batch

**Endpoint**: `POST /api/product-batches/:id/items`

**Request Body**:
```json
{
  "product_id": "uuid",
  "quantity": 500
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "batch_id": "uuid",
    "product_id": "uuid",
    "quantity": 500,
    "weight_kg": 90.00,
    "co2_per_unit": 0.95
  }
}
```

---

### 5.7. Cập Nhật Item Trong Batch

**Endpoint**: `PATCH /api/product-batches/:id/items/:product_id`

**Request Body**:
```json
{
  "quantity": 600
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "batch_id": "uuid",
    "product_id": "uuid",
    "quantity": 600,
    "weight_kg": 108.00
  }
}
```

---

### 5.8. Xóa Item Khỏi Batch

**Endpoint**: `DELETE /api/product-batches/:id/items/:product_id`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Item removed from batch successfully"
}
```

---

### 5.9. Publish Batch

**Endpoint**: `PATCH /api/product-batches/:id/publish`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "published",
    "published_at": "2026-02-20T10:00:00.000Z"
  }
}
```

---

## 6. Logistics APIs

Base path: `/api/logistics`

**Authentication**: Required (B2B role only)

---

### 6.1. Danh Sách Shipments

**Endpoint**: `GET /api/logistics/shipments`

**Query Parameters**:
- `search`: String - Tìm theo reference number
- `status`: Enum ['pending', 'in_transit', 'delivered', 'cancelled']
- `transport_mode`: Enum ['road', 'sea', 'air', 'rail']
- `date_from`: Date (YYYY-MM-DD)
- `date_to`: Date (YYYY-MM-DD)
- `page`: Number (default: 1)
- `page_size`: Number (default: 20)
- `sort_by`: String (default: 'updated_at')
- `sort_order`: Enum ['asc', 'desc'] (default: 'desc')

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "reference_number": "SHIP-2026-001",
        "origin_country": "VN",
        "origin_city": "Ho Chi Minh",
        "destination_country": "US",
        "destination_city": "Los Angeles",
        "status": "in_transit",
        "total_weight_kg": 500.00,
        "total_distance_km": 12500.00,
        "total_co2e": 150.00,
        "estimated_arrival": "2026-03-15",
        "created_at": "2026-02-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 25,
      "total_pages": 2
    }
  }
}
```

---

### 6.2. Logistics Overview

**Endpoint**: `GET /api/logistics/overview`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total_shipments": 45,
    "active_shipments": 12,
    "total_co2e": 5420.50,
    "total_distance": 125000,
    "by_status": {
      "pending": 5,
      "in_transit": 12,
      "delivered": 28,
      "cancelled": 0
    },
    "by_transport_mode": {
      "sea": 35,
      "road": 8,
      "air": 2,
      "rail": 0
    }
  }
}
```

---

### 6.3. Chi Tiết Shipment

**Endpoint**: `GET /api/logistics/shipments/:id`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reference_number": "SHIP-2026-001",
    "origin_country": "VN",
    "origin_city": "Ho Chi Minh",
    "origin_address": "123 Factory St",
    "destination_country": "US",
    "destination_city": "Los Angeles",
    "destination_address": "456 Harbor Blvd",
    "status": "in_transit",
    "total_weight_kg": 500.00,
    "total_distance_km": 12500.00,
    "total_co2e": 150.00,
    "estimated_arrival": "2026-03-15",
    "legs": [
      {
        "leg_order": 1,
        "transport_mode": "road",
        "origin_location": "Ho Chi Minh Factory",
        "destination_location": "Saigon Port",
        "distance_km": 25.00,
        "co2e": 2.45,
        "carrier_name": "VN Logistics"
      },
      {
        "leg_order": 2,
        "transport_mode": "sea",
        "origin_location": "Saigon Port",
        "destination_location": "Los Angeles Port",
        "distance_km": 12450.00,
        "co2e": 149.40,
        "carrier_name": "Pacific Shipping"
      }
    ],
    "products": [
      {
        "product_id": "uuid",
        "sku": "GF-TSHIRT-001",
        "product_name": "Organic Cotton T-Shirt",
        "quantity": 1500,
        "weight_kg": 270.00,
        "allocated_co2e": 81.00
      }
    ],
    "created_at": "2026-02-01T00:00:00.000Z"
  }
}
```

---

### 6.4. Tạo Shipment Mới

**Endpoint**: `POST /api/logistics/shipments`

**Request Body**:
```json
{
  "reference_number": "SHIP-2026-003",
  "origin_country": "VN",
  "origin_city": "Hanoi",
  "origin_address": "789 Factory Road",
  "destination_country": "EU",
  "destination_city": "Hamburg",
  "destination_address": "123 Port St",
  "estimated_arrival": "2026-04-01",
  "legs": [
    {
      "leg_order": 1,
      "transport_mode": "road",
      "origin_location": "Hanoi Factory",
      "destination_location": "Hai Phong Port",
      "distance_km": 120,
      "carrier_name": "VN Transport"
    },
    {
      "leg_order": 2,
      "transport_mode": "sea",
      "origin_location": "Hai Phong Port",
      "destination_location": "Hamburg Port",
      "distance_km": 10500,
      "carrier_name": "Euro Shipping"
    }
  ],
  "products": [
    {
      "product_id": "uuid",
      "quantity": 500
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reference_number": "SHIP-2026-003",
    "status": "pending",
    "total_co2e": 125.50,
    "created_at": "2026-02-20T10:00:00.000Z"
  }
}
```

---

### 6.5. Cập Nhật Shipment

**Endpoint**: `PATCH /api/logistics/shipments/:id`

**Request Body**:
```json
{
  "reference_number": "SHIP-2026-003-UPDATED",
  "estimated_arrival": "2026-04-05",
  "destination_address": "Updated address"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reference_number": "SHIP-2026-003-UPDATED",
    "updated_at": "2026-02-20T10:00:00.000Z"
  }
}
```

---

### 6.6. Cập Nhật Trạng Thái Shipment

**Endpoint**: `PATCH /api/logistics/shipments/:id/status`

**Request Body**:
```json
{
  "status": "delivered",
  "actual_arrival": "2026-03-14"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "delivered",
    "actual_arrival": "2026-03-14",
    "updated_at": "2026-02-20T10:00:00.000Z"
  }
}
```

---

### 6.7. Cập Nhật Legs (Transport Routes)

**Endpoint**: `PUT /api/logistics/shipments/:id/legs`

**Request Body**:
```json
{
  "legs": [
    {
      "leg_order": 1,
      "transport_mode": "road",
      "origin_location": "Factory A",
      "destination_location": "Port B",
      "distance_km": 50,
      "carrier_name": "Carrier X"
    },
    {
      "leg_order": 2,
      "transport_mode": "sea",
      "origin_location": "Port B",
      "destination_location": "Port C",
      "distance_km": 8000,
      "carrier_name": "Carrier Y"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "shipment_id": "uuid",
    "total_legs": 2,
    "total_distance_km": 8050,
    "total_co2e": 98.50
  }
}
```

---

### 6.8. Cập Nhật Products Trong Shipment

**Endpoint**: `PUT /api/logistics/shipments/:id/products`

**Request Body**:
```json
{
  "products": [
    {
      "product_id": "uuid",
      "quantity": 600
    },
    {
      "product_id": "uuid2",
      "quantity": 400
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "shipment_id": "uuid",
    "total_products": 2,
    "total_quantity": 1000,
    "total_weight_kg": 180.00
  }
}
```

---

## 7. Company Members APIs

Base path: `/api/company/members`

**Authentication**: Required (B2B role only)

---

### 7.1. Danh Sách Members

**Endpoint**: `GET /api/company/members`

**Authorization**: Company member hoặc admin

**Query Parameters**:
- `status`: Enum ['active', 'invited', 'disabled']
- `role`: Enum ['admin', 'member', 'viewer']

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "email": "member@company.com",
      "full_name": "Nguyễn Văn Member",
      "role": "member",
      "status": "active",
      "invited_by": "uuid",
      "invited_by_name": "Admin User",
      "last_login": "2026-02-19T15:30:00.000Z",
      "created_at": "2026-01-15T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "active": 4,
    "invited": 1,
    "disabled": 0
  }
}
```

---

### 7.2. Tạo Member Mới

**Endpoint**: `POST /api/company/members`

**Authorization**: Company admin only

**Request Body**:
```json
{
  "email": "newmember@company.com",
  "full_name": "Trần Thị New",
  "password": "TempPassword123!",
  "role": "member",
  "send_notification_email": true
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "email": "newmember@company.com",
    "full_name": "Trần Thị New",
    "role": "member",
    "status": "invited",
    "created_at": "2026-02-20T10:00:00.000Z"
  },
  "message": "Member created successfully. Notification email sent."
}
```

**Validation**:
- Email must not exist in system
- Password: Min 8 chars, must include uppercase, lowercase, number, special char
- Role: 'admin', 'member', or 'viewer'

---

### 7.3. Cập Nhật Member

**Endpoint**: `PUT /api/company/members/:id`

**Authorization**: Company admin only

**Request Body**:
```json
{
  "role": "admin",
  "status": "active"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "role": "admin",
    "status": "active",
    "updated_at": "2026-02-20T10:00:00.000Z"
  },
  "message": "Member updated successfully"
}
```

---

### 7.4. Xóa Member

**Endpoint**: `DELETE /api/company/members/:id`

**Authorization**: Company admin only

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

**Note**: Không thể xóa chính mình hoặc member cuối cùng có role 'admin'

---

## 8. Reports & Export Compliance APIs

This section defines the production contract used by:
- `/dashboard/reports` (Reports + Export Data tabs)
- `/dashboard/export` (Export & Compliance page)

Detailed FE/BE alignment rules are tracked in `REPORTS_EXPORT_BE_REQUIREMENTS.md`.
Reports-page specific restructure is tracked in `REPORTS_PAGE_API_RESTRUCTURE.md`.

### 8.1. Reports Overview

Base path: `/api/reports`  
Authentication: Required (B2B role only)

Report status persisted by backend:
- `processing`
- `completed`
- `failed`

Note:
- Reports UI no longer exposes manual status editing.
- Status still exists in API payload and backend workflow.

---

### 8.2. List Reports

**Endpoint**: `GET /api/reports`

**Query Parameters**:
- `search`
- `type`
- `status`
- `date_from`
- `date_to`
- `page`
- `page_size`
- `sort_by`
- `sort_order`

**Minimum item fields required by frontend**:
- `id`
- `title`
- `report_type`
- `status` (`processing | completed | failed`)
- `file_format`
- `records`
- `file_size_bytes`
- `generated_at` or `created_at`
- `download_url` (optional)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "EU Compliance Export",
        "report_type": "compliance",
        "status": "completed",
        "file_format": "xlsx",
        "records": 248,
        "file_size_bytes": 245800,
        "generated_at": "2026-02-20T10:00:00.000Z",
        "download_url": "/reports/uuid/download"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 12,
      "total_pages": 1
    }
  }
}
```

---

### 8.3. Report Detail

**Endpoint**: `GET /api/reports/:id`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "EU Compliance Export",
    "report_type": "compliance",
    "status": "completed",
    "file_format": "xlsx",
    "records": 248,
    "file_size_bytes": 245800,
    "generated_at": "2026-02-20T10:00:00.000Z",
    "download_url": "/reports/uuid/download",
    "metadata": {
      "target_market": "EU",
      "generated_by": "uuid"
    }
  }
}
```

---

### 8.4. Create Report (Manual)

**Endpoint**: `POST /api/reports`

Used by the `Create report` action in Reports tab.

**Request Body (minimum)**:
```json
{
  "title": "Q1 2026 Carbon Summary",
  "report_type": "carbon_audit",
  "file_format": "xlsx"
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "processing",
    "created_at": "2026-02-20T10:00:00.000Z"
  }
}
```

---

### 8.5. Update Report Status

**Endpoint**: `PATCH /api/reports/:id/status`

**Request Body**:
```json
{
  "status": "completed"
}
```

Valid values:
- `processing`
- `completed`
- `failed`

This endpoint is intended for system/workflow roles.

---

### 8.6. Download Report

**Endpoint**: `GET /api/reports/:id/download`

Required behavior:
- Return the actual binary file stream, or
- Return 302 redirect to a short-lived signed file URL

**Important contract (mandatory)**:
- Do not return JSON metadata payload for this endpoint.
- Metadata responses (for example `file_url`) belong to `GET /api/reports/:id`, not the download endpoint.

Recommended headers (direct streaming):
- `Content-Type`: correct mime type (`application/pdf`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/csv`, ...)
- `Content-Disposition`: `attachment; filename="..."`

Error responses:
- `404`: report not found
- `409`: report is not ready yet (`REPORT_NOT_READY`)

---

### 8.7. Unified Dataset Export Pipeline

Preferred endpoint:
- `POST /api/reports/exports`

Backward-compatible fallback:
- `POST /api/reports/export-jobs`

Used by all Export Data actions on `/dashboard/reports`.

**Request Body**:
```json
{
  "dataset_type": "product",
  "file_format": "csv",
  "title": "Products Export"
}
```

`dataset_type` values:
- `product`
- `activity`
- `audit`
- `users`
- `history`
- `analytics`
- `company`

Backend pipeline responsibilities:
1. Validate tenant/permissions.
2. Create processing report record.
3. Query dataset data.
4. Generate output file.
5. Store file and persist storage key.
6. Update report status (`completed` or `failed`).
7. Return metadata for FE polling/download.

**Response** (202 Accepted):
```json
{
  "success": true,
  "data": {
    "report_id": "uuid",
    "status": "processing",
    "title": "Products Export"
  }
}
```

---

### 8.8. Export Source Counts

Primary endpoints:
- `GET /api/reports/export-sources/products`
- `GET /api/reports/export-sources/activity`
- `GET /api/reports/export-sources/audit`
- `GET /api/reports/export-sources/users`
- `GET /api/reports/export-sources/history`

Compatible alternatives are acceptable if response includes equivalent total count fields.

---

### 8.9. Export Compliance Overview

Base path: `/api/export/markets`  
Authentication: Required (B2B role only)

---

### 8.10. List Market Compliance

**Endpoint**: `GET /api/export/markets`

Each market item should provide enough data for:
- Market cards on `/dashboard/export`
- Compliance detail modal with 4 tabs: overview, products, carbon, documents
- Centralized document manager in `/dashboard/export`

**Minimum fields per market**:
- `market_code`
- `market_name`
- `status` (`draft | incomplete | ready | verified`)
- `score` (source of truth for readiness %)
- `documents[]` (company-specific document state)
- `document_requirements[]` or `required_documents[]`
- `required_documents_count`
- `required_documents_uploaded_count`
- `required_documents_missing_count`
- `documents_total_count`
- `documents_uploaded_count`
- `documents_missing_count`
- `product_scope[]`
- `carbon_data[]`
- `recommendations[]`
- `emission_factors[]`
- `verification_*` fields (optional)

---

### 8.10.1. Document Item Payload (minimum)

Each item in `documents[]` should include:
- `id` (stable document id for upload/download/remove)
- `name`
- `required` (boolean)
- `status` (`missing | uploaded | approved | expired`)
- `valid_to` (optional)
- `uploaded_by` (optional)
- `uploaded_at` (optional)

---

### 8.10.2. Recommendation Payload Contract

Each item in `recommendations[]` should include:
- `recommendation_id` (valid uuid/object-id/ulid)
- `type` (`document | carbon_data | verification | product_scope`)
- `missing_item`
- `regulatory_reason`
- `impact_if_missing` (required, non-empty string)
- `priority` (`mandatory | important | recommended`)
- `status` (`active | completed | ignored`)
- `document_id` (optional link to documents tab)

Accepted aliases for backward compatibility:
- `business_impact` / `businessImpact`
- `impact_message`
- `consequence`

If impact is not provided, FE falls back to:
- `Chua co thong tin anh huong neu thieu.`

---

### 8.11. Recommendation Action (Optional/Deferred)

**Endpoint**: `POST /api/export/markets/:market_code/recommendations/:recommendation_id/actions`

**Request Body**:
```json
{
  "action": "mark_completed"
}
```

Current FE behavior:
- Recommendations are shown as read-only guidance.
- There is no `Apply` button dependency in current FE.
- This endpoint can be kept for a future workflow phase.

---

### 8.12. Product Scope CRUD

- `POST /api/export/markets/:market_code/products`
- `PATCH /api/export/markets/:market_code/products/:product_id`
- `DELETE /api/export/markets/:market_code/products/:product_id`

---

### 8.13. Carbon Data Update

**Endpoint**: `PATCH /api/export/markets/:market_code/carbon-data/:scope`

**Request Body**:
```json
{
  "value": 123.4,
  "unit": "kgCO2e",
  "methodology": "GHG Protocol",
  "data_source": "Internal meter",
  "reporting_period": "2026-Q1"
}
```

`scope` values:
- `scope1`
- `scope2`
- `scope3`

---

### 8.14. Document Actions

- Upload: `POST /api/export/markets/:market_code/documents/:document_id/upload` (multipart/form-data)
- Download: `GET /api/export/markets/:market_code/documents/:document_id/download`
- Remove: `DELETE /api/export/markets/:market_code/documents/:document_id`

Download contract:
- Must return actual binary file stream, or
- Must return redirect to signed file URL
- Must not return JSON metadata payload

Remove contract:
- After delete, `GET /api/export/markets` should reflect updated document state immediately for FE refresh.

---

### 8.15. Generate Compliance Report

**Endpoint**: `POST /api/export/markets/:market_code/reports`

**Request Body**:
```json
{
  "file_format": "xlsx"
}
```

Allowed `file_format`:
- `xlsx`
- `csv`
- `pdf`

Required backend behavior:
1. Validate market readiness (`ready` or `verified`).
2. Create processing report record.
3. Generate compliance file.
4. Store file and persist storage key.
5. Update report status to `completed` or `failed`.
6. Return `report_id`, `status`, and `download_url` when available.

---

## 9. Subscription APIs

Base path: `/api/subscription`

**Authentication**: Required (B2B role only)

---

### 9.1. Thông Tin Subscription

**Endpoint**: `GET /api/subscription`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "company_id": "uuid",
    "current_plan": "starter",
    "plan_details": {
      "name": "Starter Plan",
      "price": 0,
      "features": [
        "Up to 50 products",
        "Basic carbon calculation",
        "1 market analysis"
      ],
      "limits": {
        "max_products": 50,
        "max_calculations_per_month": 100,
        "max_team_members": 3,
        "export_reports": false
      }
    },
    "usage": {
      "current_products": 25,
      "calculations_this_month": 45,
      "team_members": 2
    },
    "billing": {
      "cycle": "monthly",
      "next_billing_date": null,
      "billing_email": "admin@company.com"
    },
    "available_upgrades": [
      {
        "plan": "standard",
        "name": "Standard Plan",
        "price_monthly": 99,
        "price_yearly": 950
      },
      {
        "plan": "export",
        "name": "Export Plan",
        "price_monthly": 299,
        "price_yearly": 2990
      }
    ]
  }
}
```

---

### 9.2. Nâng Cấp Subscription

**Endpoint**: `POST /api/subscription/upgrade`

**Authorization**: Company admin only

**Request Body**:
```json
{
  "target_plan": "standard",
  "billing_cycle": "yearly"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "payment_session": {
      "session_id": "stripe_session_id",
      "payment_url": "https://checkout.stripe.com/...",
      "amount": 950,
      "currency": "USD"
    },
    "target_plan": "standard",
    "billing_cycle": "yearly"
  },
  "message": "Payment session created"
}
```

**Available Plans**:
- `starter`: Free (current)
- `standard`: $99/month or $950/year
- `export`: $299/month or $2990/year

---

## 10. Error Codes

### Authentication Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `EMAIL_EXISTS` | 409 | Email đã được đăng ký |
| `INVALID_CREDENTIALS` | 401 | Email hoặc mật khẩu không đúng |
| `EMAIL_NOT_VERIFIED` | 403 | Email chưa được xác thực |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token không hợp lệ |
| `INVALID_VERIFICATION_TOKEN` | 400 | Token xác thực email không hợp lệ |
| `USER_NOT_FOUND` | 404 | Không tìm thấy user |
| `ALREADY_VERIFIED` | 400 | Email đã được xác thực |

### Authorization Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Chưa đăng nhập |
| `FORBIDDEN` | 403 | Không có quyền truy cập |
| `INVALID_TOKEN` | 401 | Token không hợp lệ |
| `TOKEN_EXPIRED` | 401 | Token hết hạn |
| `ADMIN_REQUIRED` | 403 | Yêu cầu quyền admin |

### Resource Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NO_COMPANY` | 404 | User không thuộc company nào |
| `COMPANY_NOT_FOUND` | 404 | Không tìm thấy company |
| `PRODUCT_NOT_FOUND` | 404 | Không tìm thấy sản phẩm |
| `BATCH_NOT_FOUND` | 404 | Không tìm thấy batch |
| `SHIPMENT_NOT_FOUND` | 404 | Không tìm thấy shipment |
| `REPORT_NOT_FOUND` | 404 | Không tìm thấy report |
| `MARKET_NOT_FOUND` | 404 | Không tìm thấy market compliance |
| `COMPLIANCE_DOCUMENT_NOT_FOUND` | 404 | Không tìm thấy document compliance |

### Validation Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Dữ liệu không hợp lệ |
| `DUPLICATE_SKU` | 400 | SKU đã tồn tại |
| `INVALID_STATUS_TRANSITION` | 400 | Chuyển trạng thái không hợp lệ |
| `EMPTY_SHIPMENT_PRODUCTS` | 400 | Shipment cần ít nhất 1 sản phẩm |
| `BATCH_ALREADY_PUBLISHED` | 400 | Batch đã được publish |
| `BATCH_EMPTY` | 400 | Không thể publish batch rỗng |
| `INVALID_DATASET_TYPE` | 400 | `dataset_type` không hợp lệ |
| `INVALID_FILE_FORMAT` | 400 | `file_format` không được hỗ trợ |
| `INVALID_CARBON_SCOPE` | 400 | `scope` phải là scope1/scope2/scope3 |

### Business Logic Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ALREADY_HAS_COMPANY` | 400 | User đã có company |
| `PRODUCT_NOT_IN_COMPANY` | 400 | Sản phẩm không thuộc company |
| `DUPLICATE_BATCH_ITEM` | 400 | Sản phẩm đã có trong batch |
| `REPORT_NOT_READY` | 409 | Report chưa sẵn sàng để tải |
| `COMPLIANCE_MARKET_NOT_READY` | 409 | Market chưa đạt `ready|verified` để export |
| `EXPORT_SOURCE_NOT_SUPPORTED` | 400 | Dataset export source chưa được hỗ trợ |
| `EXPORT_JOB_FAILED` | 500 | Job export thất bại ở backend pipeline |
| `NOT_IMPLEMENTED` | 501 | Tính năng chưa được triển khai |

---

## Response Format Chuẩn

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Optional success message",
  "meta": {
    // Optional metadata (pagination, etc.)
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Optional additional error details
    }
  }
}
```

### Pagination Response

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 156,
      "total_pages": 8
    }
  }
}
```

---

## Rate Limiting

- **Global API Limit**: 100 requests per 15 minutes per IP
- **Signup**: 10 requests per 15 minutes per IP
- **Signin**: 5 requests per 15 minutes per IP
- **Refresh Token**: 10 requests per 15 minutes per IP
- **Email Verification**: 3 requests per 15 minutes per IP
- **Google OAuth**: 10 requests per 15 minutes per IP

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1645363200
```

---

## Authentication

### Sử Dụng Access Token

Thêm token vào header của mỗi request:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Expiry

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days
- **Email Verification Token**: 24 hours

### Token Refresh Flow

1. Khi access token hết hạn (401 error)
2. Gọi `POST /api/auth/refresh` với refresh token
3. Nhận access token và refresh token mới
4. Retry request ban đầu với token mới

---

## Database Schema Overview

### Core Tables

- **users**: User accounts (auth credentials)
- **profiles**: Extended user info
- **companies**: B2B organizations
- **user_roles**: Role assignments (b2b/b2c/admin)
- **company_members**: Team management

### Product & Carbon Tables

- **products**: Product catalog
- **product_materials**: Material composition
- **materials**: Material master data
- **suppliers**: Supplier information
- **emission_factors**: Carbon emission factors
- **carbon_calculations**: Calculation audit logs
- **carbon_targets**: Monthly carbon targets

### Logistics Tables

- **shipments**: Shipment tracking
- **shipment_legs**: Multi-modal transport routes
- **shipment_products**: Products in shipments
- **product_batches**: Product batch management
- **product_batch_items**: Items in batches

### Compliance Tables

- **reports**: Generated reports
- **certificates**: Certifications
- **market_readiness**: Export market readiness

### AI & Chat Tables

- **ai_recommendations**: AI-generated recommendations
- **chat_conversations**: Chat sessions
- **chat_messages**: Chat message history

---

## Environment Variables

```env
# Server
PORT=4000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/weavecarbon

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@weavecarbon.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

---

## Testing

### Health Check

```bash
curl http://localhost:4000/health
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-20T10:00:00.000Z",
    "uptime": 3600.52
  }
}
```

### Sample Test Accounts

```
# B2B Admin
Email: admin@greenfashion.com
Password: Password123!

# B2B Member
Email: member@greenfashion.com
Password: Password123!

# B2C User
Email: user1@gmail.com
Password: Password123!
```

---

## Changelog

### Version 1.0.0 (2026-02-20)

**Initial Release**:
- ✅ Authentication & Authorization
- ✅ Account Management
- ✅ Dashboard APIs
- ✅ Product Management
- ✅ Batch Management
- ✅ Logistics Management
- ✅ Company Members
- ✅ Reports
- ✅ Subscription Management

**Upcoming Features**:
- 🔜 B2C Donation APIs
- 🔜 Collection Points APIs
- 🔜 Rewards System APIs
- 🔜 Webhook Events
- 🔜 GraphQL API

---

## Support & Contact

- **Documentation**: https://docs.weavecarbon.com
- **API Status**: https://status.weavecarbon.com
- **Email**: support@weavecarbon.com
- **GitHub Issues**: https://github.com/weavecarbon/backend/issues

---

**Last Updated**: February 20, 2026  
**API Version**: 1.0.0  
**Document Version**: 1.0
