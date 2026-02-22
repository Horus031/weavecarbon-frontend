import {
  api,
  apiRequest,
  authTokenStore,
  resolveApiUrl,
  isApiError,
  type ApiError } from
"@/lib/apiClient";
import type {
  AccessoryInput,
  AddressInput,
  CarbonAssessmentResult,
  EnergySourceInput,
  MaterialInput,
  ProductAssessmentData,
  TransportLeg } from
"@/components/dashboard/assessment/steps/types";

export type ProductStatus = "draft" | "published" | "archived";

export interface ProductRecord extends Omit<ProductAssessmentData, "status"> {
  id: string;
  status: ProductStatus;
  shipmentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ProductListResult {
  items: ProductRecord[];
  pagination: Pagination;
}

export interface ProductListQuery {
  search?: string;
  status?: "draft" | "published" | "archived" | "all";
  category?: string;
  page?: number;
  page_size?: number;
  sort_by?: "created_at" | "updated_at" | "name" | "sku" | "total_co2e";
  sort_order?: "asc" | "desc";
}

export type ProductSaveMode = "draft" | "publish";

export interface ProductMutationResult {
  id: string;
  status: ProductStatus;
  version: number;
  updatedAt?: string;
  shipmentId?: string | null;
}

export interface BulkValidationErrorItem {
  row: number;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface BulkValidationRowError {
  row: number;
  data: Record<string, unknown>;
  errors: BulkValidationErrorItem[];
}

export interface BulkValidationResult {
  isValid: boolean;
  totalRows: number;
  validCount: number;
  errorCount: number;
  warningCount: number;
  validRows: Record<string, unknown>[];
  invalidRows: BulkValidationRowError[];
  warnings: BulkValidationErrorItem[];
}

export interface BulkImportError {
  row: number;
  code: string;
  message: string;
}

export interface BulkImportResult {
  imported: number;
  failed: number;
  errors: BulkImportError[];
  ids: string[];
}

export type ProductBatchStatus = "draft" | "published" | "archived";

export interface ProductBatchItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  productType: string;
  quantity: number;
  weightKg: number;
  co2PerUnit: number;
}

export interface ProductBatchSummary {
  id: string;
  name: string;
  description: string;
  status: ProductBatchStatus;
  originAddress?: AddressInput;
  destinationAddress?: AddressInput;
  destinationMarket: string;
  transportModes: string[];
  shipmentId: string | null;
  totalProducts: number;
  totalQuantity: number;
  totalWeight: number;
  totalCO2: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductBatchDetail extends ProductBatchSummary {
  items: ProductBatchItem[];
}

export interface ProductBatchListResult {
  items: ProductBatchSummary[];
  pagination: Pagination;
}

export interface ProductBatchListQuery {
  search?: string;
  status?: ProductBatchStatus | "all";
  page?: number;
  page_size?: number;
}

export interface CreateBatchPayload {
  name: string;
  description?: string;
  originAddress?: Partial<AddressInput>;
  destinationAddress?: Partial<AddressInput>;
  destinationMarket?: string;
  transportModes?: string[];
}

export interface UpdateBatchPayload {
  name?: string;
  description?: string;
  originAddress?: Partial<AddressInput>;
  destinationAddress?: Partial<AddressInput>;
  destinationMarket?: string;
  transportModes?: string[];
}

export interface AddBatchItemPayload {
  product_id: string;
  quantity: number;
  weight_kg?: number;
  co2_per_unit?: number;
}

export interface UpdateBatchItemPayload {
  quantity?: number;
  weight_kg?: number;
  co2_per_unit?: number;
}

export interface PublishBatchResult {
  id: string;
  status: ProductBatchStatus;
  shipmentId: string | null;
  shipmentCreationSkipped?: boolean;
  skipReason?: string;
  message?: string;
  updatedAt?: string;
  publishedAt?: string;
}

const inflightProductListRequests = new Map<string, Promise<ProductListResult>>();
const PRODUCT_ID_REGEX =
/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type PublishStatusApiMode = "unknown" | "published" | "active";
const PRODUCT_STATUS_API_MODE_STORAGE_KEY = "weavecarbon_products_status_api_mode";

const readPublishStatusApiMode = (): PublishStatusApiMode => {
  if (typeof window === "undefined") return "unknown";
  try {
    const mode = window.localStorage.getItem(PRODUCT_STATUS_API_MODE_STORAGE_KEY);
    if (mode === "published" || mode === "active") {
      return mode;
    }
  } catch {

  }
  return "unknown";
};

let publishStatusApiMode: PublishStatusApiMode = readPublishStatusApiMode();

const writePublishStatusApiMode = (mode: Exclude<PublishStatusApiMode, "unknown">) => {
  publishStatusApiMode = mode;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PRODUCT_STATUS_API_MODE_STORAGE_KEY, mode);
  } catch {

  }
};

export const isValidProductId = (productId: string) =>
PRODUCT_ID_REGEX.test(productId.trim());

export const isValidBatchId = (batchId: string) =>
batchId.trim().length > 0;

const emptyAddress: AddressInput = {
  streetNumber: "",
  street: "",
  ward: "",
  district: "",
  city: "",
  stateRegion: "",
  country: "",
  postalCode: ""
};

const isObject = (value: unknown): value is Record<string, unknown> =>
typeof value === "object" && value !== null;

const asString = (value: unknown, fallback = "") => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
};

const asNonEmptyString = (value: unknown) => {
  const normalized = asString(value).trim();
  return normalized.length > 0 ? normalized : null;
};

const asNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const asArray = <T = unknown,>(value: unknown): T[] =>
Array.isArray(value) ? value as T[] : [];

const DESTINATION_MARKET_ALIASES: Record<string, string> = {
  eu: "eu",
  europeanunion: "eu",
  europe: "eu",
  us: "usa",
  usa: "usa",
  unitedstates: "usa",
  unitedstatesofamerica: "usa",
  america: "usa",
  jp: "japan",
  japan: "japan",
  kr: "korea",
  korea: "korea",
  southkorea: "korea",
  republicofkorea: "korea",
  cn: "china",
  china: "china",
  vn: "vietnam",
  vietnam: "vietnam",
  domestic: "vietnam",
  noidiavietnam: "vietnam",
  other: "other"
};

const normalizeDestinationMarket = (value: unknown): string => {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const raw = String(value).trim();
    if (!raw) {
      return "";
    }

    const compactKey = raw.toLowerCase().replace(/[_\-\s]+/g, "");
    return DESTINATION_MARKET_ALIASES[compactKey] || raw.toLowerCase();
  }

  if (Array.isArray(value)) {
    const selected = value.find(
      (entry) =>
      isObject(entry) &&
      Boolean(
        entry.selected ??
        entry.isSelected ??
        entry.default ??
        entry.current ??
        entry.active ?? (
        typeof entry.status === "string" && entry.status.toLowerCase() === "selected")
      )
    );
    if (selected) {
      return normalizeDestinationMarket(selected);
    }

    const normalizedValues = value.
    map((entry) => normalizeDestinationMarket(entry)).
    filter((entry) => entry.length > 0);
    if (normalizedValues.length === 1) {
      return normalizedValues[0];
    }

    return "";
  }

  if (isObject(value)) {
    const explicitCode = normalizeDestinationMarket(
      value.selectedCode ??
      value.selected_code ??
      value.currentCode ??
      value.current_code ??
      value.defaultCode ??
      value.default_code ??
      value.marketCode ??
      value.market_code
    );
    if (explicitCode) {
      return explicitCode;
    }

    const explicitSelection = normalizeDestinationMarket(
      value.selected ??
      value.current ??
      value.default ??
      value.value ??
      value.choice
    );
    if (explicitSelection) {
      return explicitSelection;
    }

    const fromCode = normalizeDestinationMarket(
      value.code ??
      value.marketCode ??
      value.market_code ??
      value.value ??
      value.id
    );
    if (fromCode) {
      return fromCode;
    }

    const fromName = normalizeDestinationMarket(
      value.name ??
      value.label ??
      value.marketName ??
      value.market_name
    );
    if (fromName) {
      return fromName;
    }

    const fromOptions = normalizeDestinationMarket(
      value.options ??
      value.items ??
      value.list ??
      value.values ??
      value.markets ??
      value.destinationMarkets ??
      value.destination_markets
    );
    if (fromOptions) {
      return fromOptions;
    }
  }

  return "";
};

const toSafePage = (value: unknown, fallback = 1) => {
  const page = asNumber(value, fallback);
  if (!Number.isFinite(page)) return fallback;
  return Math.max(1, Math.trunc(page));
};

const toSafePageSize = (value: unknown, fallback = 20) => {
  const pageSize = asNumber(value, fallback);
  if (!Number.isFinite(pageSize)) return fallback;
  return Math.min(100, Math.max(1, Math.trunc(pageSize)));
};

const toIsoString = (value: unknown) => {
  if (typeof value === "string" && value.length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    return value;
  }
  return new Date().toISOString();
};

const toProductStatus = (value: unknown): ProductStatus => {
  const normalized = asString(value).toLowerCase();
  if (normalized === "published" || normalized === "active") {
    return "published";
  }
  if (normalized === "archived") {
    return "archived";
  }
  return "draft";
};

const normalizeAddress = (value: unknown): AddressInput => {
  if (!isObject(value)) {
    return { ...emptyAddress };
  }

  const latValue = value.lat ?? value.latitude;
  const lngValue = value.lng ?? value.longitude;

  const next: AddressInput = {
    streetNumber: asString(value.streetNumber ?? value.street_number),
    street: asString(value.street),
    ward: asString(value.ward),
    district: asString(value.district),
    city: asString(value.city),
    stateRegion: asString(value.stateRegion ?? value.state_region),
    country: asString(value.country),
    postalCode: asString(value.postalCode ?? value.postal_code)
  };

  if (latValue !== undefined && latValue !== null && latValue !== "") {
    next.lat = asNumber(latValue);
  }
  if (lngValue !== undefined && lngValue !== null && lngValue !== "") {
    next.lng = asNumber(lngValue);
  }

  return next;
};

const normalizeMaterials = (value: unknown): MaterialInput[] =>
asArray(value).
filter(isObject).
map((item, index) => ({
  id: asString(item.id, `material-${index + 1}`),
  materialType: asString(item.materialType ?? item.material_type),
  percentage: asNumber(item.percentage),
  source: (() => {
    const source = asString(item.source).toLowerCase();
    if (source === "domestic" || source === "imported" || source === "unknown") {
      return source as MaterialInput["source"];
    }
    return "unknown" as MaterialInput["source"];
  })(),
  certifications: asArray(item.certifications).map((cert) => asString(cert))
})).
filter((item) => item.materialType.length > 0);

const normalizeAccessories = (value: unknown): AccessoryInput[] =>
asArray(value).
filter(isObject).
map((item, index) => ({
  id: asString(item.id, `accessory-${index + 1}`),
  name: asString(item.name),
  type: asString(item.type),
  weight:
  item.weight === undefined || item.weight === null ?
  undefined :
  asNumber(item.weight)
})).
filter((item) => item.name.length > 0 || item.type.length > 0);

const normalizeEnergySources = (value: unknown): EnergySourceInput[] =>
asArray(value).
filter(isObject).
map((item, index) => ({
  id: asString(item.id, `energy-${index + 1}`),
  source: asString(item.source),
  percentage: asNumber(item.percentage)
})).
filter((item) => item.source.length > 0);

const normalizeTransportLegs = (value: unknown): TransportLeg[] =>
asArray(value).
filter(isObject).
map((item, index) => {
  const mode = asString(item.mode).toLowerCase();
  const normalizedMode =
  mode === "road" || mode === "sea" || mode === "air" || mode === "rail" ?
  mode :
  "road";

  return {
    id: asString(item.id, `leg-${index + 1}`),
    mode: normalizedMode,
    estimatedDistance:
    item.estimatedDistance !== undefined ?
    asNumber(item.estimatedDistance) :
    item.estimated_distance !== undefined ?
    asNumber(item.estimated_distance) :
    undefined
  } as TransportLeg;
});

const normalizeCarbonResults = (value: unknown): CarbonAssessmentResult | undefined => {
  if (!isObject(value)) return undefined;

  const perProductCandidate = value.perProduct ?? value.per_product;
  const totalBatchCandidate = value.totalBatch ?? value.total_batch;
  const perProductRaw: Record<string, unknown> = isObject(perProductCandidate) ?
  perProductCandidate :
  {};
  const totalBatchRaw: Record<string, unknown> = isObject(totalBatchCandidate) ?
  totalBatchCandidate :
  {};

  const confidence = asString(value.confidenceLevel ?? value.confidence_level).toLowerCase();
  const confidenceLevel: CarbonAssessmentResult["confidenceLevel"] =
  confidence === "high" || confidence === "medium" || confidence === "low" ?
  confidence :
  "medium";

  return {
    perProduct: {
      materials: asNumber(perProductRaw.materials),
      production: asNumber(perProductRaw.production),
      energy: asNumber(perProductRaw.energy),
      transport: asNumber(perProductRaw.transport),
      total: asNumber(perProductRaw.total)
    },
    totalBatch: {
      materials: asNumber(totalBatchRaw.materials),
      production: asNumber(totalBatchRaw.production),
      energy: asNumber(totalBatchRaw.energy),
      transport: asNumber(totalBatchRaw.transport),
      total: asNumber(totalBatchRaw.total)
    },
    confidenceLevel,
    proxyUsed: Boolean(value.proxyUsed ?? value.proxy_used),
    proxyNotes: asArray(value.proxyNotes ?? value.proxy_notes).map((note) =>
    asString(note)
    ),
    scope1: asNumber(value.scope1),
    scope2: asNumber(value.scope2),
    scope3: asNumber(value.scope3)
  };
};

const normalizeProductFromUnknown = (value: unknown): ProductRecord | null => {
  if (!isObject(value)) return null;

  const payload = isObject(value.payload) ? value.payload : {};
  const source: Record<string, unknown> = { ...payload, ...value };

  const idCandidates = [
  value.id,
  value.productId,
  value.product_id,
  value.productUuid,
  value.product_uuid,
  source.id,
  source.productId,
  source.product_id,
  source.productUuid,
  source.product_uuid,
  payload.id,
  payload.productId,
  payload.product_id,
  payload.productUuid,
  payload.product_uuid].

  map((candidate) => asNonEmptyString(candidate)).
  filter((candidate): candidate is string => Boolean(candidate));

  const id =
  idCandidates.find((candidate) => isValidProductId(candidate)) ||
  idCandidates[0] ||
  "";

  if (!id) return null;

  const createdAt = toIsoString(source.createdAt ?? source.created_at);
  const updatedAt = toIsoString(source.updatedAt ?? source.updated_at);

  const status = toProductStatus(source.status);
  const weightPerUnit =
  source.weightPerUnit !== undefined ?
  asNumber(source.weightPerUnit) :
  source.weight_per_unit !== undefined ?
  asNumber(source.weight_per_unit) :
  source.weight_kg !== undefined ?
  asNumber(source.weight_kg) * 1000 :
  0;

  const destinationMarket = normalizeDestinationMarket(
    payload.destinationMarketCode ??
    payload.destination_market_code ??
    payload.marketCode ??
    payload.market_code ??
    payload.destinationMarket ??
    payload.destination_market ??
    payload.targetMarket ??
    payload.target_market ??
    payload.market ??
    payload.destinationMarkets ??
    payload.destination_markets ??
    source.destinationMarketCode ??
    source.destination_market_code ??
    source.marketCode ??
    source.market_code ??
    source.destinationMarket ??
    source.destination_market ??
    source.targetMarket ??
    source.target_market ??
    source.market ??
    source.destinationMarkets ??
    source.destination_markets
  );

  return {
    id,
    productCode: asString(source.productCode ?? source.product_code ?? source.sku),
    productName: asString(source.productName ?? source.product_name ?? source.name),
    productType: asString(source.productType ?? source.product_type ?? source.category),
    weightPerUnit,
    quantity: asNumber(source.quantity),
    materials: normalizeMaterials(payload.materials ?? source.materials),
    accessories: normalizeAccessories(payload.accessories ?? source.accessories),
    productionProcesses: asArray(
      payload.productionProcesses ??
      payload.production_processes ??
      source.productionProcesses ??
      source.production_processes
    ).map((process) => asString(process)),
    energySources: normalizeEnergySources(
      payload.energySources ??
      payload.energy_sources ??
      source.energySources ??
      source.energy_sources
    ),
    manufacturingLocation: asString(
      payload.manufacturingLocation ??
      payload.manufacturing_location ??
      source.manufacturingLocation ??
      source.manufacturing_location
    ),
    wasteRecovery: asString(
      payload.wasteRecovery ??
      payload.waste_recovery ??
      source.wasteRecovery ??
      source.waste_recovery
    ),
    destinationMarket,
    originAddress: normalizeAddress(
      payload.originAddress ??
      payload.origin_address ??
      source.originAddress ??
      source.origin_address
    ),
    destinationAddress: normalizeAddress(
      payload.destinationAddress ??
      payload.destination_address ??
      source.destinationAddress ??
      source.destination_address
    ),
    transportLegs: normalizeTransportLegs(
      payload.transportLegs ??
      payload.transport_legs ??
      source.transportLegs ??
      source.transport_legs
    ),
    estimatedTotalDistance: asNumber(
      payload.estimatedTotalDistance ??
      payload.estimated_total_distance ??
      source.estimatedTotalDistance ??
      source.estimated_total_distance
    ),
    carbonResults: normalizeCarbonResults(
      payload.carbonResults ??
      payload.carbon_results ??
      source.carbonResults ??
      source.carbon_results
    ),
    status,
    shipmentId: asNonEmptyString(source.shipmentId ?? source.shipment_id),
    version: Math.max(1, asNumber(source.version, 1)),
    createdAt,
    updatedAt
  };
};

const defaultPagination = (count: number): Pagination => ({
  page: 1,
  page_size: count,
  total: count,
  total_pages: count > 0 ? 1 : 0
});

const normalizePagination = (
value: unknown,
fallbackCount: number)
: Pagination => {
  if (!isObject(value)) {
    return defaultPagination(fallbackCount);
  }

  const page = Math.max(1, asNumber(value.page, 1));
  const pageSize = Math.max(1, asNumber(value.page_size ?? value.pageSize, 20));
  const total = Math.max(0, asNumber(value.total, fallbackCount));
  const totalPages = Math.max(
    0,
    asNumber(value.total_pages ?? value.totalPages, total > 0 ? Math.ceil(total / pageSize) : 0)
  );

  return {
    page,
    page_size: pageSize,
    total,
    total_pages: totalPages
  };
};

const normalizeProductListPayload = (payload: unknown): ProductListResult => {
  let rawItems: unknown[] = [];
  let rawPagination: unknown = undefined;

  if (Array.isArray(payload)) {
    rawItems = payload;
  } else if (isObject(payload)) {
    if (Array.isArray(payload.items)) {
      rawItems = payload.items;
      rawPagination = payload.pagination;
    } else if (Array.isArray(payload.products)) {
      rawItems = payload.products;
      rawPagination = payload.pagination;
    } else if (Array.isArray(payload.data)) {
      rawItems = payload.data;
      rawPagination = payload.pagination;
    }
  }

  const items = rawItems.
  map((item) => normalizeProductFromUnknown(item)).
  filter((item): item is ProductRecord => item !== null);

  return {
    items,
    pagination: normalizePagination(rawPagination, items.length)
  };
};

const toQueryString = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim().length === 0) return;
    query.set(key, String(value));
  });

  const serialized = query.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
};

const normalizeMutationPayload = (payload: unknown): ProductMutationResult => {
  if (!isObject(payload)) {
    throw new Error("Invalid product mutation response from server.");
  }

  const id = asString(payload.id);
  if (!id) {
    throw new Error("Product id was not returned by server.");
  }

  return {
    id,
    status: toProductStatus(payload.status),
    version: Math.max(1, asNumber(payload.version, 1)),
    shipmentId: (() => {
      const shipmentId = asString(payload.shipmentId ?? payload.shipment_id);
      return shipmentId || null;
    })(),
    updatedAt: payload.updatedAt ?
    asString(payload.updatedAt) :
    payload.updated_at ?
    asString(payload.updated_at) :
    undefined
  };
};

const buildProductRequestBody = (
product: ProductAssessmentData,
saveMode?: ProductSaveMode) =>
{
  const payload: Record<string, unknown> = {
    ...product
  };

  if (saveMode) {
    payload.save_mode = saveMode;
  }

  return payload;
};

const parseErrorResponse = async (response: Response) => {
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as unknown;
      if (isObject(payload)) {
        const error = payload.error;
        if (isObject(error) && typeof error.message === "string") {
          return error.message;
        }
      }
    }
  } catch {

  }

  return response.statusText || "Request failed";
};

const resolvePublishedStatusForApi = () =>
publishStatusApiMode === "active" ? "active" : "published";

const isEmptyProductListResult = (result: ProductListResult) =>
result.items.length === 0 && result.pagination.total === 0;

export const fetchProducts = async (
query: ProductListQuery = {})
: Promise<ProductListResult> => {
  const safePage = toSafePage(query.page, 1);
  const safePageSize = toSafePageSize(query.page_size, 20);
  const requestedStatus = query.status;
  const effectiveStatus =
  requestedStatus === "published" ? resolvePublishedStatusForApi() : requestedStatus;
  const buildQueryString = (statusOverride?: string) =>
  toQueryString({
    search: query.search,
    status: statusOverride ?? effectiveStatus,
    category: query.category,
    page: safePage,
    page_size: safePageSize,
    sort_by: query.sort_by,
    sort_order: query.sort_order
  });

  const queryString = buildQueryString();

  const requestKey = `products${queryString}`;
  const existingRequest = inflightProductListRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      const payload = await api.get<unknown>(`/products${queryString}`);
      const normalizedPayload = normalizeProductListPayload(payload);

      if (requestedStatus === "published") {
        if (!isEmptyProductListResult(normalizedPayload)) {
          if (effectiveStatus === "published") {
            writePublishStatusApiMode("published");
          } else if (effectiveStatus === "active") {
            writePublishStatusApiMode("active");
          }
          return normalizedPayload;
        }


        const alternateStatus = effectiveStatus === "active" ? "published" : "active";
        try {
          const alternatePayload = await api.get<unknown>(
            `/products${buildQueryString(alternateStatus)}`
          );
          const normalizedAlternate = normalizeProductListPayload(alternatePayload);

          if (!isEmptyProductListResult(normalizedAlternate)) {
            writePublishStatusApiMode(alternateStatus);
            return normalizedAlternate;
          }
        } catch {

        }
      }

      return normalizedPayload;
    } catch (error) {

      if (
      requestedStatus === "published" &&
      effectiveStatus !== "active" &&
      isApiError(error) &&
      error.status === 400)
      {
        writePublishStatusApiMode("active");
        const fallbackQueryString = buildQueryString("active");
        const fallbackPayload = await api.get<unknown>(`/products${fallbackQueryString}`);
        return normalizeProductListPayload(fallbackPayload);
      }

      if (
      requestedStatus === "published" &&
      effectiveStatus === "active" &&
      isApiError(error) &&
      error.status === 400)
      {
        writePublishStatusApiMode("published");
        const fallbackQueryString = buildQueryString("published");
        const fallbackPayload = await api.get<unknown>(`/products${fallbackQueryString}`);
        return normalizeProductListPayload(fallbackPayload);
      }
      throw error;
    }
  })();

  inflightProductListRequests.set(requestKey, request);
  try {
    return await request;
  } finally {
    inflightProductListRequests.delete(requestKey);
  }
};

export const fetchAllProducts = async (
query: Omit<ProductListQuery, "page" | "page_size"> = {})
: Promise<ProductRecord[]> => {
  const aggregated: ProductRecord[] = [];
  let page = 1;

  while (true) {
    const result = await fetchProducts({ ...query, page, page_size: 100 });
    aggregated.push(...result.items);

    if (page >= result.pagination.total_pages || result.items.length === 0) {
      break;
    }

    page += 1;
  }

  return aggregated;
};

export const fetchProductById = async (productId: string): Promise<ProductRecord> => {
  if (!isValidProductId(productId)) {
    throw new Error("Invalid product ID format.");
  }

  const payload = await api.get<unknown>(`/products/${productId}`);
  const product = normalizeProductFromUnknown(payload);

  if (!product) {
    throw new Error("Product not found.");
  }

  return product;
};

export const createProduct = async (
product: ProductAssessmentData,
saveMode: ProductSaveMode)
: Promise<ProductMutationResult> => {
  const payload = await api.post<unknown>(
    "/products",
    buildProductRequestBody(product, saveMode)
  );
  return normalizeMutationPayload(payload);
};

export const updateProduct = async (
productId: string,
product: ProductAssessmentData)
: Promise<ProductMutationResult> => {
  const payload = await api.put<unknown>(
    `/products/${productId}`,
    buildProductRequestBody(product)
  );
  return normalizeMutationPayload(payload);
};

export const updateProductStatus = async (
productId: string,
status: ProductStatus)
: Promise<ProductMutationResult> => {
  const statusForApi =
  status === "published" ? resolvePublishedStatusForApi() : status;

  try {
    const payload = await api.patch<unknown>(`/products/${productId}/status`, {
      status: statusForApi
    });
    if (status === "published" && statusForApi === "published") {
      writePublishStatusApiMode("published");
    }
    return normalizeMutationPayload(payload);
  } catch (error) {

    if (
    status === "published" &&
    statusForApi !== "active" &&
    isApiError(error) &&
    error.status === 400)
    {
      writePublishStatusApiMode("active");
      const payload = await api.patch<unknown>(`/products/${productId}/status`, {
        status: "active"
      });
      return normalizeMutationPayload(payload);
    }

    if (
    status === "published" &&
    statusForApi === "active" &&
    isApiError(error) &&
    error.status === 400)
    {
      writePublishStatusApiMode("published");
      const payload = await api.patch<unknown>(`/products/${productId}/status`, {
        status: "published"
      });
      return normalizeMutationPayload(payload);
    }
    throw error;
  }
};

export const archiveProduct = async (productId: string) => {
  await api.delete<unknown>(`/products/${productId}`);
};

const normalizeValidationErrors = (
errors: unknown,
row: number,
severity: "error" | "warning")
: BulkValidationErrorItem[] => {
  if (Array.isArray(errors)) {
    return errors.map((error, index) => {
      if (isObject(error)) {
        return {
          row: asNumber(error.row, row),
          field: asString(error.field, `field_${index + 1}`),
          message: asString(error.message, "Invalid value"),
          severity:
          asString(error.severity).toLowerCase() === "warning" ? "warning" : severity
        };
      }

      return {
        row,
        field: `field_${index + 1}`,
        message: asString(error, "Invalid value"),
        severity
      };
    });
  }

  if (typeof errors === "string") {
    return [
    {
      row,
      field: "general",
      message: errors,
      severity
    }];

  }

  return [];
};

const normalizeBulkValidationPayload = (payload: unknown): BulkValidationResult => {
  if (!isObject(payload)) {
    return {
      isValid: false,
      totalRows: 0,
      validCount: 0,
      errorCount: 0,
      warningCount: 0,
      validRows: [],
      invalidRows: [],
      warnings: []
    };
  }

  const invalidRows = asArray(payload.invalidRows ?? payload.invalid_rows).
  filter(isObject).
  map((rowData, index) => {
    const row = asNumber(rowData.row, index + 1);
    return {
      row,
      data: isObject(rowData.data) ? rowData.data : {},
      errors: normalizeValidationErrors(rowData.errors, row, "error")
    };
  });

  const warnings = asArray(payload.warnings).
  flatMap((warning, index) => {
    if (isObject(warning)) {
      return [
      {
        row: asNumber(warning.row, index + 1),
        field: asString(warning.field, "general"),
        message: asString(warning.message),
        severity: "warning" as const
      }];

    }
    return [
    {
      row: index + 1,
      field: "general",
      message: asString(warning),
      severity: "warning" as const
    }];

  }).
  filter((item) => item.message.length > 0);

  const validRows = asArray(payload.validRows ?? payload.valid_rows).filter(isObject);

  return {
    isValid: Boolean(payload.isValid ?? payload.is_valid ?? invalidRows.length === 0),
    totalRows: asNumber(payload.totalRows ?? payload.total_rows, validRows.length + invalidRows.length),
    validCount: asNumber(payload.validCount ?? payload.valid_count, validRows.length),
    errorCount: asNumber(payload.errorCount ?? payload.error_count, invalidRows.length),
    warningCount: asNumber(payload.warningCount ?? payload.warning_count, warnings.length),
    validRows,
    invalidRows,
    warnings
  };
};

const normalizeBulkImportPayload = (payload: unknown): BulkImportResult => {
  if (!isObject(payload)) {
    return {
      imported: 0,
      failed: 0,
      errors: [],
      ids: []
    };
  }

  return {
    imported: Math.max(0, asNumber(payload.imported)),
    failed: Math.max(0, asNumber(payload.failed)),
    errors: asArray(payload.errors).
    filter(isObject).
    map((error, index) => ({
      row: asNumber(error.row, index + 1),
      code: asString(error.code, "IMPORT_ERROR"),
      message: asString(error.message, "Import failed")
    })),
    ids: asArray(payload.ids).map((id) => asString(id)).filter(Boolean)
  };
};

export const validateProductsBulkImport = async (
rows: Record<string, unknown>[])
: Promise<BulkValidationResult> => {
  const payload = await api.post<unknown>("/products/bulk-import/validate", {
    rows
  });
  return normalizeBulkValidationPayload(payload);
};

export const importProductsBulkRows = async (
rows: Record<string, unknown>[],
saveMode: ProductSaveMode = "draft")
: Promise<BulkImportResult> => {
  const payload = await api.post<unknown>("/products/bulk-import", {
    rows,
    save_mode: saveMode
  });
  return normalizeBulkImportPayload(payload);
};

export const importProductsBulkFile = async (
file: File,
saveMode: ProductSaveMode = "draft")
: Promise<BulkImportResult> => {
  const body = new FormData();
  body.append("file", file);
  body.append("save_mode", saveMode);

  const payload = await apiRequest<unknown>("/products/bulk-import/file", {
    method: "POST",
    body
  });

  return normalizeBulkImportPayload(payload);
};

export const downloadProductsBulkTemplate = async (
format: "xlsx" | "csv" = "xlsx") =>
{
  const token = authTokenStore.getAccessToken();
  const response = await fetch(
    resolveApiUrl(`/products/bulk-template?format=${encodeURIComponent(format)}`),
    {
      method: "GET",
      credentials: "include",
      headers: token ?
      {
        Authorization: `Bearer ${token}`
      } :
      undefined
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i);
  const rawFilename = filenameMatch?.[1] || filenameMatch?.[2];
  const filename = rawFilename ?
  decodeURIComponent(rawFilename) :
  `products_import_template.${format}`;

  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
};

const toBatchStatus = (value: unknown): ProductBatchStatus => {
  const normalized = asString(value).toLowerCase();
  if (normalized === "published") return "published";
  if (normalized === "archived") return "archived";
  return "draft";
};

const normalizeBatchItem = (value: unknown): ProductBatchItem | null => {
  if (!isObject(value)) return null;

  const productId = asString(value.productId ?? value.product_id);
  const explicitId = asString(value.id);
  const fallbackId =
  productId ||
  asString(value.product_code ?? value.productCode ?? value.sku) ||
  asString(value.added_at ?? value.addedAt);
  const id = explicitId || fallbackId;
  if (!id) return null;

  return {
    id,
    productId,
    productCode: asString(value.productCode ?? value.product_code ?? value.sku),
    productName: asString(value.productName ?? value.product_name ?? value.name),
    productType: asString(value.productType ?? value.product_type ?? value.category),
    quantity: asNumber(value.quantity, 0),
    weightKg: asNumber(value.weightKg ?? value.weight_kg, 0),
    co2PerUnit: asNumber(value.co2PerUnit ?? value.co2_per_unit ?? value.unit_co2e, 0)
  };
};

const normalizeBatchSummary = (value: unknown): ProductBatchSummary | null => {
  if (!isObject(value)) return null;

  const id = asString(value.id);
  if (!id) return null;

  return {
    id,
    name: asString(value.name ?? value.batch_name),
    description: asString(value.description),
    status: toBatchStatus(value.status),
    originAddress: isObject(value.originAddress ?? value.origin_address) ?
    normalizeAddress(value.originAddress ?? value.origin_address) :
    undefined,
    destinationAddress: isObject(value.destinationAddress ?? value.destination_address) ?
    normalizeAddress(value.destinationAddress ?? value.destination_address) :
    undefined,
    destinationMarket: normalizeDestinationMarket(
      value.destinationMarketCode ??
      value.destination_market_code ??
      value.marketCode ??
      value.market_code ??
      value.destinationMarket ??
      value.destination_market ??
      value.destinationMarkets ??
      value.destination_markets
    ),
    transportModes: asArray(value.transportModes ?? value.transport_modes).map((mode) =>
    asString(mode)
    ),
    shipmentId: (() => {
      const shipmentId = asString(value.shipmentId ?? value.shipment_id);
      return shipmentId || null;
    })(),
    totalProducts: asNumber(
      value.totalProducts ??
      value.total_products ??
      value.itemCount ??
      value.item_count,
      0
    ),
    totalQuantity: asNumber(value.totalQuantity ?? value.total_quantity, 0),
    totalWeight: asNumber(value.totalWeight ?? value.total_weight_kg ?? value.total_weight, 0),
    totalCO2: asNumber(value.totalCO2 ?? value.total_co2e, 0),
    publishedAt: (() => {
      const publishedAt = value.publishedAt ?? value.published_at;
      return publishedAt ? toIsoString(publishedAt) : undefined;
    })(),
    createdAt: toIsoString(value.createdAt ?? value.created_at),
    updatedAt: toIsoString(value.updatedAt ?? value.updated_at)
  };
};

const normalizeBatchDetail = (value: unknown): ProductBatchDetail | null => {
  const summary = normalizeBatchSummary(value);
  if (!summary || !isObject(value)) return null;

  const items = asArray(value.items).
  map((item) => normalizeBatchItem(item)).
  filter((item): item is ProductBatchItem => item !== null);

  return {
    ...summary,
    items
  };
};

const normalizeBatchListPayload = (payload: unknown): ProductBatchListResult => {
  let rawItems: unknown[] = [];
  let rawPagination: unknown = undefined;

  if (Array.isArray(payload)) {
    rawItems = payload;
  } else if (isObject(payload)) {
    if (Array.isArray(payload.items)) {
      rawItems = payload.items;
      rawPagination = payload.pagination;
    } else if (Array.isArray(payload.batches)) {
      rawItems = payload.batches;
      rawPagination = payload.pagination;
    }
  }

  const items = rawItems.
  map((item) => normalizeBatchSummary(item)).
  filter((item): item is ProductBatchSummary => item !== null);

  return {
    items,
    pagination: normalizePagination(rawPagination, items.length)
  };
};

export const listProductBatches = async (
query: ProductBatchListQuery = {})
: Promise<ProductBatchListResult> => {
  const queryString = toQueryString({
    search: query.search,
    status: query.status,
    page: query.page,
    page_size: query.page_size
  });

  const payload = await api.get<unknown>(`/product-batches${queryString}`);
  return normalizeBatchListPayload(payload);
};

export const getProductBatchById = async (
batchId: string)
: Promise<ProductBatchDetail> => {
  const normalizedBatchId = batchId.trim();
  if (!normalizedBatchId) {
    throw new Error("Batch ID is required.");
  }

  const payload = await api.get<unknown>(
    `/product-batches/${encodeURIComponent(normalizedBatchId)}`
  );
  const normalized = normalizeBatchDetail(payload);

  if (!normalized) {
    throw new Error("Batch not found.");
  }

  return normalized;
};

export const createProductBatch = async (
input: CreateBatchPayload)
: Promise<ProductBatchDetail> => {
  const camelPayload = {
    name: input.name,
    description: input.description,
    originAddress: input.originAddress,
    destinationAddress: input.destinationAddress,
    destinationMarket: input.destinationMarket,
    transportModes: input.transportModes
  };
  const snakePayload = {
    batch_name: input.name,
    description: input.description,
    origin_address: input.originAddress,
    destination_address: input.destinationAddress,
    destination_market: input.destinationMarket,
    transport_modes: input.transportModes
  };

  const tryCreate = async (payload: Record<string, unknown>) =>
  api.post<unknown>("/product-batches", payload);

  let payload: unknown;
  try {
    payload = await tryCreate(camelPayload);
  } catch (error) {
    const shouldRetryWithSnakeCase =
    isApiError(error) && error.code === "VALIDATION_ERROR";
    if (!shouldRetryWithSnakeCase) {
      throw error;
    }
    payload = await tryCreate(snakePayload);
  }

  if (isObject(payload) && typeof payload.id === "string") {
    try {
      return await getProductBatchById(payload.id);
    } catch {
      const summary = normalizeBatchSummary(payload);
      if (summary) {
        return { ...summary, items: [] };
      }
    }
  }

  const detail = normalizeBatchDetail(payload);
  if (!detail) {
    throw new Error("Unable to create batch.");
  }

  return detail;
};

export const updateProductBatch = async (
batchId: string,
input: UpdateBatchPayload)
: Promise<ProductBatchDetail> => {
  const camelPayload = {
    name: input.name,
    description: input.description,
    originAddress: input.originAddress,
    destinationAddress: input.destinationAddress,
    destinationMarket: input.destinationMarket,
    transportModes: input.transportModes
  };
  const snakePayload = {
    batch_name: input.name,
    description: input.description,
    origin_address: input.originAddress,
    destination_address: input.destinationAddress,
    destination_market: input.destinationMarket,
    transport_modes: input.transportModes
  };

  try {
    await api.patch<unknown>(`/product-batches/${batchId}`, camelPayload);
  } catch (error) {
    const shouldRetryWithSnakeCase =
    isApiError(error) && error.code === "VALIDATION_ERROR";
    if (!shouldRetryWithSnakeCase) {
      throw error;
    }
    await api.patch<unknown>(`/product-batches/${batchId}`, snakePayload);
  }
  return getProductBatchById(batchId);
};

export const deleteProductBatch = async (batchId: string) => {
  await api.delete<unknown>(`/product-batches/${batchId}`);
};

export const addProductToBatch = async (
batchId: string,
payload: AddBatchItemPayload) =>
{
  await api.post<unknown>(`/product-batches/${batchId}/items`, payload);
};

export const updateProductBatchItem = async (
batchId: string,
productId: string,
payload: UpdateBatchItemPayload) =>
{
  await api.patch<unknown>(`/product-batches/${batchId}/items/${productId}`, payload);
};

export const removeProductBatchItem = async (
batchId: string,
productId: string) =>
{
  await api.delete<unknown>(`/product-batches/${batchId}/items/${productId}`);
};

export const publishProductBatch = async (
batchId: string)
: Promise<PublishBatchResult> => {
  const payload = await api.patch<unknown>(`/product-batches/${batchId}/publish`);

  if (!isObject(payload)) {
    throw new Error("Invalid publish response from server.");
  }

  return {
    id: asString(payload.id, batchId),
    status: toBatchStatus(payload.status),
    shipmentId: asString(payload.shipmentId ?? payload.shipment_id) || null,
    shipmentCreationSkipped: Boolean(
      payload.shipmentCreationSkipped ?? payload.shipment_creation_skipped
    ),
    skipReason: asString(payload.skipReason ?? payload.skip_reason) || undefined,
    message: asString(payload.message) || undefined,
    updatedAt: payload.updatedAt ?
    asString(payload.updatedAt) :
    payload.updated_at ?
    asString(payload.updated_at) :
    undefined,
    publishedAt: payload.publishedAt ?
    asString(payload.publishedAt) :
    payload.published_at ?
    asString(payload.published_at) :
    undefined
  };
};

export const formatApiErrorMessage = (error: unknown, fallback: string) => {
  if (isApiError(error)) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

export const getApiErrorCode = (error: unknown) => {
  if (isApiError(error)) {
    return (error as ApiError).code;
  }
  return undefined;
};