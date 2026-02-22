# Frontend Export Data API Guide

## Tổng quan

BE cung cấp endpoint `GET /api/reports/export-data/:type` trả về **raw JSON data** (columns + rows) từ SQL thật. FE dùng dữ liệu này để tự tạo file **XLSX / CSV** phía client bằng thư viện [SheetJS (xlsx)](https://www.npmjs.com/package/xlsx).

> **Ưu điểm:** FE kiểm soát hoàn toàn format file, tên sheet, style, không cần chờ BE sinh file.

---

## 1. Cài thư viện SheetJS

```bash
npm install xlsx
# hoặc
yarn add xlsx
```

---

## 2. API Endpoint

### `GET /api/reports/export-data/:type`

**Headers bắt buộc:**
```
Authorization: Bearer <token>
```

**Params:**

| Param | Giá trị hợp lệ | Mô tả |
|-------|----------------|-------|
| `:type` | `products` | Danh sách sản phẩm + CO₂ |
| | `activity` | Tất cả carbon calculations |
| | `audit` | Chỉ audit calculations |
| | `users` | Thành viên công ty |
| | `history` | Lịch sử báo cáo đã tạo |
| | `analytics` | Carbon targets theo tháng |
| | `company` | Thông tin công ty |

**Response thành công (200):**
```json
{
  "success": true,
  "data": {
    "dataset_type": "product",
    "columns": ["sku", "name", "category", "status", "weight_kg", "total_co2e", "materials_co2e", "production_co2e", "transport_co2e", "packaging_co2e", "data_confidence_score", "created_at"],
    "rows": [
      {
        "sku": "P001",
        "name": "Áo cotton organic",
        "category": "Apparel",
        "status": "active",
        "weight_kg": "0.2500",
        "total_co2e": "3.2000",
        "materials_co2e": "1.5000",
        "production_co2e": "0.8000",
        "transport_co2e": "0.6000",
        "packaging_co2e": "0.3000",
        "data_confidence_score": "85.00",
        "created_at": "2026-01-15T08:30:00.000Z"
      }
    ],
    "total": 1
  }
}
```

**Error responses:**

| Status | Code | Khi nào |
|--------|------|---------|
| 400 | `INVALID_SOURCE_TYPE` | `:type` không hợp lệ |
| 401 | `UNAUTHORIZED` | Thiếu hoặc sai token |
| 404 | `NO_COMPANY` | User chưa thuộc company nào |

---

## 3. Columns trả về theo từng type

### `products`
| Column | Kiểu | Mô tả |
|--------|------|-------|
| sku | string | Mã sản phẩm |
| name | string | Tên sản phẩm |
| category | string | Danh mục |
| status | string | draft / active / archived |
| weight_kg | decimal | Khối lượng (kg) |
| total_co2e | decimal | Tổng CO₂e (kg) |
| materials_co2e | decimal | CO₂e từ nguyên liệu |
| production_co2e | decimal | CO₂e từ sản xuất |
| transport_co2e | decimal | CO₂e từ vận chuyển |
| packaging_co2e | decimal | CO₂e từ đóng gói |
| data_confidence_score | decimal | Điểm tin cậy (0-100) |
| created_at | datetime | Ngày tạo |

### `activity`
| Column | Kiểu | Mô tả |
|--------|------|-------|
| calculation_type | string | Loại tính toán |
| period_start | date | Ngày bắt đầu |
| period_end | date | Ngày kết thúc |
| materials_co2e | decimal | CO₂e nguyên liệu |
| production_co2e | decimal | CO₂e sản xuất |
| transport_co2e | decimal | CO₂e vận chuyển |
| packaging_co2e | decimal | CO₂e đóng gói |
| total_co2e | decimal | Tổng CO₂e |
| methodology | string | Phương pháp tính |
| emission_factor_version | string | Phiên bản EF |
| notes | string | Ghi chú |
| created_at | datetime | Ngày tạo |
| product_name | string | Tên sản phẩm liên quan |
| product_sku | string | SKU sản phẩm |

### `audit`
Giống `activity` nhưng chỉ lấy records có `calculation_type = 'audit'`.

### `users`
| Column | Kiểu | Mô tả |
|--------|------|-------|
| email | string | Email |
| full_name | string | Họ tên |
| role | string | Vai trò (owner/admin/member) |
| status | string | Trạng thái (active/invited) |
| last_login | datetime | Lần đăng nhập cuối |
| created_at | datetime | Ngày tham gia |

### `history`
| Column | Kiểu | Mô tả |
|--------|------|-------|
| title | string | Tên báo cáo |
| report_type | string | Loại báo cáo |
| dataset_type | string | Loại dataset (nếu có) |
| status | string | processing / completed / failed |
| file_format | string | csv / xlsx / pdf |
| records | integer | Số dòng |
| file_size_bytes | integer | Dung lượng file |
| generated_at | datetime | Ngày sinh file |
| created_at | datetime | Ngày tạo |

### `analytics`
| Column | Kiểu | Mô tả |
|--------|------|-------|
| year | integer | Năm |
| month | integer | Tháng (1-12) |
| target_co2e | decimal | Mục tiêu CO₂e |
| actual_co2e | decimal | CO₂e thực tế |
| reduction_percentage | decimal | % giảm phát thải |
| created_at | datetime | Ngày tạo |

---

## 4. Code mẫu cho FE (React / Next.js)

### 4.1. Service function

```typescript
// services/reportExportService.ts
import * as XLSX from 'xlsx';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type DatasetType = 'products' | 'activity' | 'audit' | 'users' | 'history' | 'analytics';

interface ExportDataResponse {
  success: boolean;
  data: {
    dataset_type: string;
    columns: string[];
    rows: Record<string, any>[];
    total: number;
  };
}

/**
 * Gọi API lấy raw data
 */
export async function fetchExportData(token: string, type: DatasetType): Promise<ExportDataResponse> {
  const res = await fetch(`${API_BASE}/api/reports/export-data/${type}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to fetch export data');
  }

  return res.json();
}

/**
 * Tải file XLSX từ raw data
 */
export function downloadAsXlsx(
  columns: string[],
  rows: Record<string, any>[],
  filename: string,
  sheetName = 'Sheet1'
) {
  // Sắp xếp columns theo thứ tự mong muốn
  const orderedRows = rows.map(row => {
    const ordered: Record<string, any> = {};
    columns.forEach(col => {
      ordered[col] = row[col] ?? '';
    });
    return ordered;
  });

  const ws = XLSX.utils.json_to_sheet(orderedRows, { header: columns });

  // Set column widths tự động
  ws['!cols'] = columns.map(col => ({
    wch: Math.max(col.length, 12)
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

/**
 * Tải file CSV từ raw data
 */
export function downloadAsCsv(
  columns: string[],
  rows: Record<string, any>[],
  filename: string
) {
  const ws = XLSX.utils.json_to_sheet(rows, { header: columns });
  const csv = XLSX.utils.sheet_to_csv(ws);
  
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### 4.2. React component (nút Export)

```tsx
// components/ExportButton.tsx
'use client';

import { useState } from 'react';
import { fetchExportData, downloadAsXlsx, downloadAsCsv, DatasetType } from '@/services/reportExportService';
import { useAuth } from '@/hooks/useAuth'; // hook lấy token

interface ExportButtonProps {
  datasetType: DatasetType;
  format?: 'xlsx' | 'csv';
  label?: string;
}

const SHEET_NAMES: Record<string, string> = {
  products: 'San pham',
  activity: 'Hoat dong',
  audit: 'Audit',
  users: 'Thanh vien',
  history: 'Lich su',
  analytics: 'Phan tich',
};

export default function ExportButton({ datasetType, format = 'xlsx', label }: ExportButtonProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const res = await fetchExportData(token, datasetType);
      const { columns, rows, total } = res.data;

      if (total === 0) {
        alert('Không có dữ liệu để xuất');
        return;
      }

      const date = new Date().toISOString().split('T')[0];
      const filename = `${datasetType}_export_${date}.${format}`;
      const sheetName = SHEET_NAMES[datasetType] || 'Data';

      if (format === 'xlsx') {
        downloadAsXlsx(columns, rows, filename, sheetName);
      } else {
        downloadAsCsv(columns, rows, filename);
      }
    } catch (err: any) {
      console.error('Export failed:', err);
      alert(err.message || 'Xuất dữ liệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={loading}>
      {loading ? 'Đang xuất...' : (label || `Xuất ${format.toUpperCase()}`)}
    </button>
  );
}
```

### 4.3. Sử dụng trong trang Reports

```tsx
// app/dashboard/reports/page.tsx
import ExportButton from '@/components/ExportButton';

export default function ReportsPage() {
  return (
    <div>
      <h2>Xuất dữ liệu</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Xuất sản phẩm */}
        <div className="card">
          <h3>Sản phẩm</h3>
          <ExportButton datasetType="products" format="xlsx" label="Xuất XLSX" />
          <ExportButton datasetType="products" format="csv" label="Xuất CSV" />
        </div>

        {/* Xuất hoạt động carbon */}
        <div className="card">
          <h3>Hoạt động Carbon</h3>
          <ExportButton datasetType="activity" format="xlsx" />
        </div>

        {/* Xuất thành viên */}
        <div className="card">
          <h3>Thành viên</h3>
          <ExportButton datasetType="users" format="xlsx" />
        </div>

        {/* Xuất lịch sử */}
        <div className="card">
          <h3>Lịch sử báo cáo</h3>
          <ExportButton datasetType="history" format="xlsx" />
        </div>

        {/* Xuất phân tích */}
        <div className="card">
          <h3>Phân tích</h3>
          <ExportButton datasetType="analytics" format="xlsx" />
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Lấy số lượng record trước khi xuất (preview)

Dùng endpoint `GET /api/reports/export-sources` để hiển thị số lượng record cho user trước khi bấm xuất:

```typescript
// Lấy tất cả counts 1 lần
const res = await fetch(`${API_BASE}/api/reports/export-sources`, {
  headers: { Authorization: `Bearer ${token}` },
});
const { data } = await res.json();
// data = { products: 150, activity: 320, audit: 45, users: 12, history: 89 }
```

Hiển thị:
```tsx
<div className="card">
  <h3>Sản phẩm ({counts.products} records)</h3>
  <ExportButton datasetType="products" format="xlsx" />
</div>
```

---

## 6. Xử lý lỗi

```typescript
try {
  const res = await fetchExportData(token, 'products');
  // ...
} catch (err) {
  if (err.message.includes('UNAUTHORIZED')) {
    // Token hết hạn → redirect login
  } else if (err.message.includes('NO_COMPANY')) {
    // User chưa thuộc company 
  } else if (err.message.includes('INVALID_SOURCE_TYPE')) {
    // Type không hợp lệ
  }
}
```

---

## 7. Flow tóm tắt

```
1. FE gọi GET /api/reports/export-sources      → hiển thị số record
2. User bấm "Xuất XLSX"
3. FE gọi GET /api/reports/export-data/products → nhận JSON { columns, rows }
4. FE dùng SheetJS tạo file XLSX trong browser
5. Browser tự động tải file xuống
```

**Không cần poll, không cần chờ BE sinh file. Tải ngay lập tức.**
