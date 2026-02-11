import type { TransportLeg } from "@/types/transport";

export interface TrackShipment {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  status: "in_transit" | "delivered" | "pending";
  progress: number;
  origin: string;
  destination: string;
  estimatedArrival: string;
  departureDate: string;
  currentLocation: string;
  legs: TransportLeg[];
  totalCO2: number;
  carrier: string;
  containerNo: string;
}
