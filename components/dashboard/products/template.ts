import * as XLSX from "xlsx";

// Template column definitions with Vietnamese headers
export const TEMPLATE_COLUMNS = [
  // Group A - Basic SKU Info
  {
    key: "sku",
    header: "Mã SKU *",
    width: 15,
    required: true,
    example: "SKU-001",
  },
  {
    key: "productName",
    header: "Tên sản phẩm *",
    width: 25,
    required: true,
    example: "Áo T-shirt Cotton",
  },
  {
    key: "productType",
    header: "Loại sản phẩm *",
    width: 15,
    required: true,
    example: "Áo thun",
    options: "Áo thun, Quần, Váy/Đầm, Áo khoác, Giày, Túi, Phụ kiện, Khác",
  },
  {
    key: "quantity",
    header: "Số lượng *",
    width: 12,
    required: true,
    example: "1000",
  },
  {
    key: "weightPerUnit",
    header: "Trọng lượng (gram) *",
    width: 18,
    required: true,
    example: "250",
  },

  // Group B - Materials
  {
    key: "primaryMaterial",
    header: "Vải chính *",
    width: 20,
    required: true,
    example: "Cotton",
    options:
      "Cotton, Polyester, Nylon, Len, Lụa, Linen, Polyester tái chế, Cotton hữu cơ, Bamboo, Hemp, Pha trộn",
  },
  {
    key: "primaryMaterialPercentage",
    header: "Tỷ lệ vải chính (%) *",
    width: 18,
    required: true,
    example: "100",
  },
  {
    key: "secondaryMaterial",
    header: "Vải phụ",
    width: 20,
    required: false,
    example: "Polyester",
  },
  {
    key: "secondaryMaterialPercentage",
    header: "Tỷ lệ vải phụ (%)",
    width: 18,
    required: false,
    example: "0",
  },
  {
    key: "accessories",
    header: "Phụ liệu",
    width: 25,
    required: false,
    example: "Nút, Khoá kéo",
  },
  {
    key: "materialSource",
    header: "Nguồn nguyên liệu *",
    width: 18,
    required: true,
    example: "Trong nước",
    options: "Trong nước, Nhập khẩu, Không xác định",
  },

  // Group C - Manufacturing
  {
    key: "processes",
    header: "Công đoạn sản xuất *",
    width: 30,
    required: true,
    example: "Dệt kim, Cắt may, Nhuộm",
    options: "Dệt kim, Dệt thoi, Cắt may, Nhuộm, In, Hoàn tất",
  },
  {
    key: "energySource",
    header: "Nguồn năng lượng *",
    width: 18,
    required: true,
    example: "Điện lưới",
    options: "Điện lưới, Điện mặt trời, Than đá, Hỗn hợp",
  },

  // Group D - Export & Transport
  {
    key: "marketType",
    header: "Thị trường *",
    width: 15,
    required: true,
    example: "Xuất khẩu",
    options: "Nội địa, Xuất khẩu",
  },
  {
    key: "exportCountry",
    header: "Quốc gia xuất khẩu",
    width: 20,
    required: false,
    example: "EU (Châu Âu)",
    options: "EU (Châu Âu), Mỹ, Nhật Bản, Hàn Quốc, Khác",
  },
  {
    key: "transportMode",
    header: "Hình thức vận chuyển *",
    width: 20,
    required: true,
    example: "Đường biển",
    options:
      "Đường bộ, Đường biển, Đường hàng không, Đường sắt, Đa phương thức",
  },
];

// Generate sample data rows for template
const SAMPLE_DATA = [
  {
    sku: "SKU-001",
    productName: "Áo T-shirt Organic Cotton",
    productType: "Áo thun",
    quantity: 1000,
    weightPerUnit: 250,
    primaryMaterial: "Cotton hữu cơ",
    primaryMaterialPercentage: 100,
    secondaryMaterial: "",
    secondaryMaterialPercentage: 0,
    accessories: "Nhãn, Chỉ may",
    materialSource: "Trong nước",
    processes: "Dệt kim, Cắt may",
    energySource: "Điện lưới",
    marketType: "Xuất khẩu",
    exportCountry: "EU (Châu Âu)",
    transportMode: "Đường biển",
  },
  {
    sku: "SKU-002",
    productName: "Quần Jeans Recycled Denim",
    productType: "Quần",
    quantity: 500,
    weightPerUnit: 450,
    primaryMaterial: "Polyester tái chế",
    primaryMaterialPercentage: 80,
    secondaryMaterial: "Cotton",
    secondaryMaterialPercentage: 20,
    accessories: "Nút, Khoá kéo, Rivets",
    materialSource: "Nhập khẩu",
    processes: "Dệt thoi, Cắt may, Nhuộm",
    energySource: "Hỗn hợp",
    marketType: "Xuất khẩu",
    exportCountry: "Mỹ",
    transportMode: "Đường biển",
  },
  {
    sku: "SKU-003",
    productName: "Túi Tote Canvas",
    productType: "Túi",
    quantity: 2000,
    weightPerUnit: 180,
    primaryMaterial: "Cotton",
    primaryMaterialPercentage: 100,
    secondaryMaterial: "",
    secondaryMaterialPercentage: 0,
    accessories: "Quai, Khoá",
    materialSource: "Trong nước",
    processes: "Cắt may, In",
    energySource: "Điện mặt trời",
    marketType: "Nội địa",
    exportCountry: "",
    transportMode: "Đường bộ",
  },
];

export const generateTemplate = (format: "xlsx" | "csv" = "xlsx"): void => {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create data sheet with headers and sample data
  const headers = TEMPLATE_COLUMNS.map((col) => col.header);
  const sampleRows = SAMPLE_DATA.map((row) =>
    TEMPLATE_COLUMNS.map((col) => row[col.key as keyof typeof row] || ""),
  );

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws["!cols"] = TEMPLATE_COLUMNS.map((col) => ({ wch: col.width }));

  // Add data sheet
  XLSX.utils.book_append_sheet(wb, ws, "Dữ liệu sản phẩm");

  // Create instructions sheet
  const instructionsData = [
    ["HƯỚNG DẪN SỬ DỤNG FILE MẪU"],
    [""],
    ["1. NHÓM A - THÔNG TIN SKU CƠ BẢN"],
    ["   - Mã SKU: Mã duy nhất cho sản phẩm (bắt buộc)"],
    ["   - Tên sản phẩm: Tên đầy đủ của sản phẩm (bắt buộc)"],
    ["   - Loại sản phẩm: Chọn từ danh sách có sẵn (bắt buộc)"],
    ["   - Số lượng: Số lượng sản xuất (bắt buộc)"],
    [
      "   - Trọng lượng: Trọng lượng trung bình mỗi sản phẩm tính bằng gram (bắt buộc)",
    ],
    [""],
    ["2. NHÓM B - NGUYÊN VẬT LIỆU"],
    ["   - Vải chính: Loại vải/nguyên liệu chính (bắt buộc)"],
    ["   - Tỷ lệ vải chính: Phần trăm vải chính trong sản phẩm (bắt buộc)"],
    ["   - Vải phụ: Loại vải/nguyên liệu phụ (tùy chọn)"],
    ["   - Tỷ lệ vải phụ: Phần trăm vải phụ (tùy chọn)"],
    ["   - Phụ liệu: Nút, khoá kéo, chỉ may, v.v. (tùy chọn)"],
    [
      "   - Nguồn nguyên liệu: Trong nước / Nhập khẩu / Không xác định (bắt buộc)",
    ],
    [""],
    ["3. NHÓM C - QUY TRÌNH SẢN XUẤT"],
    [
      "   - Công đoạn: Liệt kê các công đoạn, cách nhau bằng dấu phẩy (bắt buộc)",
    ],
    [
      "   - Nguồn năng lượng: Điện lưới / Điện mặt trời / Than đá / Hỗn hợp (bắt buộc)",
    ],
    [""],
    ["4. NHÓM D - XUẤT KHẨU & VẬN CHUYỂN"],
    ["   - Thị trường: Nội địa hoặc Xuất khẩu (bắt buộc)"],
    [
      "   - Quốc gia xuất khẩu: Nếu xuất khẩu, chọn quốc gia/khu vực (tùy chọn)",
    ],
    [
      "   - Hình thức vận chuyển: Đường bộ / biển / hàng không / sắt (bắt buộc)",
    ],
    [""],
    ["LƯU Ý:"],
    ["   - Các trường có dấu * là bắt buộc"],
    ['   - Tham khảo sheet "Danh sách lựa chọn" để xem các giá trị hợp lệ'],
    ["   - File mẫu có 3 dòng dữ liệu ví dụ, hãy xóa trước khi nhập liệu"],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions["!cols"] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Hướng dẫn");

  // Create options reference sheet
  const optionsData = [
    ["DANH SÁCH GIÁ TRỊ HỢP LỆ"],
    [""],
    [
      "Loại sản phẩm:",
      "Áo thun, Quần, Váy/Đầm, Áo khoác, Giày, Túi, Phụ kiện, Khác",
    ],
    [""],
    [
      "Loại vải:",
      "Cotton, Polyester, Nylon, Len, Lụa, Linen, Polyester tái chế, Cotton hữu cơ, Bamboo, Hemp, Pha trộn",
    ],
    [""],
    ["Nguồn nguyên liệu:", "Trong nước, Nhập khẩu, Không xác định"],
    [""],
    ["Công đoạn sản xuất:", "Dệt kim, Dệt thoi, Cắt may, Nhuộm, In, Hoàn tất"],
    [""],
    ["Nguồn năng lượng:", "Điện lưới, Điện mặt trời, Than đá, Hỗn hợp"],
    [""],
    ["Thị trường:", "Nội địa, Xuất khẩu"],
    [""],
    ["Quốc gia xuất khẩu:", "EU (Châu Âu), Mỹ, Nhật Bản, Hàn Quốc, Khác"],
    [""],
    [
      "Hình thức vận chuyển:",
      "Đường bộ, Đường biển, Đường hàng không, Đường sắt, Đa phương thức",
    ],
  ];

  const wsOptions = XLSX.utils.aoa_to_sheet(optionsData);
  wsOptions["!cols"] = [{ wch: 25 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsOptions, "Danh sách lựa chọn");

  // Generate file
  const fileName = `WeaveCarbon_Template_${new Date().toISOString().split("T")[0]}`;

  if (format === "xlsx") {
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } else {
    // For CSV, only export the data sheet
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
};
