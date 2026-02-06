// Demo data for compliance module
import {
  MarketCompliance,
  MarketCode,
  MARKET_REGULATIONS,
  MARKET_DOCUMENT_REQUIREMENTS,
} from "./types";

// Generate demo compliance data for each market
export const generateDemoComplianceData = (): Record<
  MarketCode,
  MarketCompliance
> => {
  const markets: MarketCode[] = ["EU", "US", "JP", "KR"];
  const result: Record<MarketCode, MarketCompliance> = {} as Record<
    MarketCode,
    MarketCompliance
  >;

  const marketNames: Record<MarketCode, string> = {
    EU: "Châu Âu",
    US: "Hoa Kỳ",
    JP: "Nhật Bản",
    KR: "Hàn Quốc",
  };

  // Demo scenarios per market (as per PRD)
  const demoScenarios: Record<
    MarketCode,
    {
      score: number;
      status: "draft" | "incomplete" | "ready" | "verified";
      missingItems: string[];
    }
  > = {
    EU: {
      score: 85,
      status: "incomplete",
      missingItems: ["Third-party Verification Report"],
    },
    US: {
      score: 65,
      status: "incomplete",
      missingItems: [
        "Product Carbon Footprint (PCF)",
        "Product Carbon Declaration",
      ],
    },
    JP: {
      score: 72,
      status: "incomplete",
      missingItems: ["Product Environmental Declaration"],
    },
    KR: {
      score: 58,
      status: "incomplete",
      missingItems: [
        "Third-party Verification",
        "Facility-level Emission Proof",
      ],
    },
  };

  markets.forEach((market) => {
    const scenario = demoScenarios[market];
    const docs = MARKET_DOCUMENT_REQUIREMENTS[market];

    result[market] = {
      market,
      marketName: marketNames[market],
      regulation: MARKET_REGULATIONS[market],
      score: scenario.score,
      status: scenario.status,
      lastUpdated: new Date().toISOString(),
      documents: docs.map((doc, idx) => ({
        id: `${market}-doc-${idx}`,
        name: doc.name,
        type: "PDF",
        required: doc.required,
        status: scenario.missingItems.includes(doc.name)
          ? "missing"
          : "uploaded",
        uploadedBy: scenario.missingItems.includes(doc.name)
          ? undefined
          : "Nguyễn Văn A",
        uploadedDate: scenario.missingItems.includes(doc.name)
          ? undefined
          : "2024-01-15",
        validFrom: scenario.missingItems.includes(doc.name)
          ? undefined
          : "2024-01-01",
        validTo: scenario.missingItems.includes(doc.name)
          ? undefined
          : "2024-12-31",
        linkedProducts: scenario.missingItems.includes(doc.name)
          ? []
          : ["SKU-001", "SKU-002"],
      })),
      carbonData: [
        {
          scope: "scope1",
          value: 125.5,
          unit: "kgCO₂e",
          methodology: "GHG Protocol",
          dataSource: "Internal measurement",
          reportingPeriod: "Q4 2024",
          isComplete: true,
        },
        {
          scope: "scope2",
          value: 89.3,
          unit: "kgCO₂e",
          methodology: "GHG Protocol",
          dataSource: "Utility bills",
          reportingPeriod: "Q4 2024",
          isComplete: true,
        },
        {
          scope: "scope3",
          value: market === "US" ? null : 234.8,
          unit: "kgCO₂e",
          methodology: "GHG Protocol",
          dataSource: market === "US" ? "" : "Supplier data",
          reportingPeriod: "Q4 2024",
          isComplete: market !== "US",
        },
      ],
      productScope: [
        {
          productId: "SKU-001",
          productName: "Áo Polo Cotton Organic",
          hsCode: "6105.10.00",
          productionSite: "Nhà máy Bình Dương",
          exportVolume: 5000,
          unit: "units",
        },
        {
          productId: "SKU-002",
          productName: "Quần Jean Tái chế",
          hsCode: "6203.42.00",
          productionSite: "Nhà máy Đồng Nai",
          exportVolume: 3000,
          unit: "units",
        },
      ],
      emissionFactors: [
        {
          name: "Grid Electricity - Vietnam",
          source: "DEFRA 2024",
          version: "v2024.1",
          appliedDate: "2024-01-01",
        },
        {
          name: "Cotton Fiber - Organic",
          source: "Ecoinvent 3.9",
          version: "v3.9.1",
          appliedDate: "2024-01-01",
        },
      ],
      recommendations: generateRecommendations(market, scenario.missingItems),
      verificationRequired: market === "EU" || market === "KR",
      verifiedBy: undefined,
      verificationStatus: "pending",
      approvalNote: undefined,
    };
  });

  return result;
};

// Generate recommendations based on missing items
function generateRecommendations(
  market: MarketCode,
  missingItems: string[],
): MarketCompliance["recommendations"] {
  const recommendations: MarketCompliance["recommendations"] = [];

  // Document-based recommendations
  missingItems.forEach((item, idx) => {
    if (item.includes("Verification")) {
      recommendations.push({
        id: `${market}-rec-${idx}`,
        type: "verification",
        missingItem: `Chưa có xác minh độc lập dữ liệu phát thải`,
        regulatoryReason: getVerificationReason(market),
        businessImpact:
          "Có thể bị yêu cầu bổ sung khi kiểm tra. Chậm tiến độ xuất khẩu.",
        recommendedAction: [
          "Liên hệ đơn vị kiểm toán phát thải được công nhận",
          "Chuẩn bị hồ sơ dữ liệu carbon đầy đủ",
          "Tải lên báo cáo xác minh sau khi hoàn tất",
        ],
        priority: market === "EU" ? "important" : "recommended",
        ctaLabel: "Tải lên báo cáo xác minh",
        ctaAction: "upload_verification",
        status: "active",
      });
    } else if (item.includes("Carbon") || item.includes("PCF")) {
      recommendations.push({
        id: `${market}-rec-${idx}`,
        type: "carbon_data",
        missingItem: `Chưa có dữ liệu Carbon Footprint cho sản phẩm`,
        regulatoryReason: getCarbonDataReason(market),
        businessImpact:
          "Giảm độ tin cậy khi làm việc với đối tác. Hạn chế khả năng đáp ứng yêu cầu khí hậu.",
        recommendedAction: [
          "Khai báo năng lượng tiêu thụ trong sản xuất",
          "Nhập dữ liệu nguyên vật liệu chính",
          "Áp dụng phương pháp GHG Protocol hoặc ISO 14067",
        ],
        priority: "important",
        ctaLabel: "Khai báo dữ liệu carbon",
        ctaAction: "input_carbon_data",
        status: "active",
      });
    } else if (
      item.includes("Declaration") ||
      item.includes("Report") ||
      item.includes("Proof")
    ) {
      recommendations.push({
        id: `${market}-rec-${idx}`,
        type: "document",
        missingItem: `${item} chưa được nộp`,
        regulatoryReason: getDocumentReason(market, item),
        businessImpact:
          "Không đủ điều kiện hoàn tất hồ sơ xuất khẩu. Có nguy cơ bị từ chối thông quan hoặc phạt hành chính.",
        recommendedAction: [
          `Chuẩn bị ${item} theo mẫu chuẩn`,
          "Đảm bảo dữ liệu khớp với báo cáo carbon",
          "Tải lên tài liệu sau khi hoàn tất",
        ],
        priority: "mandatory",
        ctaLabel: `Tải lên ${item}`,
        ctaAction: "upload_document",
        status: "active",
      });
    }
  });

  // Add product scope recommendation if score is low
  if (market === "JP") {
    recommendations.push({
      id: `${market}-rec-scope`,
      type: "product_scope",
      missingItem: "Một số sản phẩm chưa có mã HS Code đầy đủ",
      regulatoryReason:
        "JIS yêu cầu mã HS Code chính xác để phân loại sản phẩm xuất khẩu.",
      businessImpact: "Có thể gây chậm trễ trong quá trình thông quan.",
      recommendedAction: [
        "Kiểm tra lại mã HS Code cho từng sản phẩm",
        "Cập nhật thông tin sản phẩm trong hệ thống",
      ],
      priority: "recommended",
      ctaLabel: "Cập nhật sản phẩm",
      ctaAction: "update_products",
      status: "active",
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { mandatory: 0, important: 1, recommended: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function getVerificationReason(market: MarketCode): string {
  const reasons: Record<MarketCode, string> = {
    EU: "CBAM giai đoạn sau (từ 2026) yêu cầu xác minh bởi bên thứ ba được EU công nhận.",
    US: "Một số bang yêu cầu xác minh độc lập cho báo cáo GHG.",
    JP: "JIS khuyến nghị xác minh bởi đơn vị được công nhận để tăng độ tin cậy.",
    KR: "K-ETS yêu cầu xác minh độc lập cho báo cáo phát thải hàng năm.",
  };
  return reasons[market];
}

function getCarbonDataReason(market: MarketCode): string {
  const reasons: Record<MarketCode, string> = {
    EU: "CBAM yêu cầu khai báo dữ liệu phát thải chi tiết theo sản phẩm.",
    US: "Một số bang tại Mỹ (California) yêu cầu công bố phát thải theo sản phẩm.",
    JP: "JIS Q 14067 yêu cầu khai báo carbon footprint sản phẩm.",
    KR: "K-ETS yêu cầu dữ liệu phát thải cấp sản phẩm để tính toán quota.",
  };
  return reasons[market];
}

function getDocumentReason(market: MarketCode, docName: string): string {
  if (market === "EU") {
    return `Yêu cầu bắt buộc theo Regulation (EU) 2023/956. ${docName} là cơ sở để EU đánh giá phát thải sản phẩm nhập khẩu.`;
  }
  if (market === "KR") {
    return `Yêu cầu theo Act on Allocation and Trading of GHG Emission Permits. ${docName} cần thiết cho báo cáo K-ETS.`;
  }
  return `${docName} là tài liệu cần thiết để đáp ứng quy định xuất khẩu của thị trường này.`;
}

// Calculate compliance score based on components
export function calculateComplianceScore(compliance: MarketCompliance): number {
  const weights = {
    productScope: 25,
    carbonData: 35,
    documents: 30,
    verification: 10,
  };

  // Product scope score (25%)
  const productScopeScore = compliance.productScope.length > 0 ? 100 : 0;

  // Carbon data score (35%)
  const completeCarbonData = compliance.carbonData.filter(
    (d) => d.isComplete,
  ).length;
  const carbonDataScore =
    (completeCarbonData / compliance.carbonData.length) * 100;

  // Documents score (30%)
  const requiredDocs = compliance.documents.filter((d) => d.required);
  const completedDocs = requiredDocs.filter(
    (d) => d.status === "uploaded" || d.status === "approved",
  );
  const documentsScore =
    requiredDocs.length > 0
      ? (completedDocs.length / requiredDocs.length) * 100
      : 100;

  // Verification score (10%)
  const verificationScore = compliance.verificationRequired
    ? compliance.verificationStatus === "verified"
      ? 100
      : 0
    : 100;

  return Math.round(
    (productScopeScore * weights.productScope +
      carbonDataScore * weights.carbonData +
      documentsScore * weights.documents +
      verificationScore * weights.verification) /
      100,
  );
}
