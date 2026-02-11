import type { ProductStatus } from "@/types/product";

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  published: "Published",
  archived: "Archived",
};

export const PRODUCT_STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  in_review: {
    label: "In Review",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  published: {
    label: "Published",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  archived: {
    label: "Archived",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
};

export const TRANSPORT_MODE_LABELS: Record<string, string> = {
  truck_light: "Xe t蘯｣i nh蘯ｹ",
  truck_heavy: "Xe t蘯｣i n蘯ｷng",
  ship: "Tﾃu bi盻ハ",
  air: "Mﾃ｡y bay",
  rail: "ﾄ脆ｰ盻拵g s蘯ｯt",
};

export const CATEGORY_LABELS: Record<string, string> = {
  apparel: "Qu蘯ｧn ﾃ｡o",
  footwear: "Giﾃy dﾃｩp",
  accessories: "Ph盻･ ki盻㌻",
  textiles: "V蘯｣i textile",
  homegoods: "ﾄ雪ｻ・gia d盻･ng",
};

export const MATERIAL_LABELS: Record<string, string> = {
  cotton: "Cotton",
  polyester: "Polyester",
  wool: "Wool",
  silk: "Silk",
  linen: "Linen",
  nylon: "Nylon",
  recycled_polyester: "Recycled Polyester",
  organic_cotton: "Organic Cotton",
  bamboo: "Bamboo",
  hemp: "Hemp",
};

export const CERTIFICATION_LABELS: Record<string, string> = {
  gots: "GOTS",
  oeko_tex: "OEKO-TEX",
  grs: "GRS",
  bci: "BCI Cotton",
  fsc: "FSC",
};

export const MARKET_LABELS: Record<string, string> = {
  eu: "Chﾃ｢u ﾃＶ (EU)",
  us: "Hoa K盻ｳ",
  jp: "Nh蘯ｭt B蘯｣n",
  kr: "Hﾃn Qu盻祖",
  domestic: "N盻冓 ﾄ黛ｻ蟻 Vi盻㏄ Nam",
};
