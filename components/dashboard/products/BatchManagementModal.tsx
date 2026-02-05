/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import { useBatches, BatchProduct } from "@/contexts/BatchContext";
import { useProducts, DashboardProduct } from "@/contexts/ProductContext";
import { useShipments } from "@/contexts/ShipmentContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Trash2,
  Send,
  Layers,
  Search,
  CheckCircle2,
} from "lucide-react";

interface BatchManagementModalProps {
  open: boolean;
  onClose: () => void;
  initialBatchId?: string;
}

const BatchManagementModal: React.FC<BatchManagementModalProps> = ({
  open,
  onClose,
  initialBatchId,
}) => {
  const {
    batches,
    createBatch,
    updateBatch,
    addProductToBatch,
    removeProductFromBatch,
  } = useBatches();
  const { products } = useProducts();
  const { createShipmentFromBatch } = useShipments();

  const [activeTab, setActiveTab] = useState<"list" | "create" | "detail">(
    initialBatchId ? "detail" : "list",
  );
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(
    initialBatchId || null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Create batch form
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchDescription, setNewBatchDescription] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId),
    [batches, selectedBatchId],
  );

  // Filter available products (not in any batch, or draft/published status)
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const inBatch = batches.some(
        (b) =>
          b.products.some((bp) => bp.productId === p.id) &&
          b.id !== selectedBatchId,
      );
      return (
        matchesSearch &&
        !inBatch &&
        (p.status === "draft" || p.status === "published")
      );
    });
  }, [products, batches, searchQuery, selectedBatchId]);

  const handleCreateBatch = () => {
    if (!newBatchName.trim()) {
      toast.error("Vui lòng nhập tên lô hàng");
      return;
    }

    const batch = createBatch(newBatchName, newBatchDescription);

    // Add selected products
    selectedProductIds.forEach((productId) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        const batchProduct: BatchProduct = {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity: 100, // Default quantity
          co2PerUnit: product.co2,
          weight: product.weight,
        };
        addProductToBatch(batch.id, batchProduct);
      }
    });

    toast.success(`Đã tạo lô hàng "${newBatchName}"`);
    setNewBatchName("");
    setNewBatchDescription("");
    setSelectedProductIds([]);
    setSelectedBatchId(batch.id);
    setActiveTab("detail");
  };

  const handleAddProductToBatch = (product: DashboardProduct) => {
    if (!selectedBatchId) return;

    const batchProduct: BatchProduct = {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity: 100,
      co2PerUnit: product.co2,
      weight: product.weight,
    };

    addProductToBatch(selectedBatchId, batchProduct);
    toast.success(`Đã thêm "${product.name}" vào lô hàng`);
  };

  const handleRemoveProductFromBatch = (productId: string) => {
    if (!selectedBatchId) return;
    removeProductFromBatch(selectedBatchId, productId);
    toast.success("Đã xóa sản phẩm khỏi lô hàng");
  };

  const handlePublishBatch = async () => {
    if (!selectedBatch || selectedBatch.products.length === 0) {
      toast.error("Lô hàng cần có ít nhất 1 sản phẩm");
      return;
    }

    setIsPublishing(true);

    try {
      // Publish the batch
      //   const published = publishBatch(selectedBatch.id);

      // Create shipment for the batch
      const productDataArray = selectedBatch.products.map((p) => {
        const product = products.find((prod) => prod.id === p.productId);
        return {
          productCode: p.sku,
          productName: p.name,
          productType: product?.category || "apparel",
          weightPerUnit: p.weight * 1000, // Convert to grams
          quantity: p.quantity,
          materials: [],
          accessories: [],
          productionProcesses: [],
          energySources: [],
          manufacturingLocation: "",
          wasteRecovery: "",
          destinationMarket: selectedBatch.destinationMarket || "eu",
          originAddress: selectedBatch.originAddress || {
            streetNumber: "",
            street: "",
            ward: "",
            district: "",
            city: "TP.HCM",
            stateRegion: "",
            country: "Vietnam",
            postalCode: "",
          },
          destinationAddress: selectedBatch.destinationAddress || {
            streetNumber: "",
            street: "",
            ward: "",
            district: "",
            city: "Rotterdam",
            stateRegion: "",
            country: "Netherlands",
            postalCode: "",
          },
          transportLegs: (selectedBatch.transportModes || ["sea"]).map(
            (mode, i) => ({
              id: `leg-${i}`,
              mode: mode as "road" | "sea" | "air" | "rail",
              estimatedDistance: mode === "sea" ? 10000 : 50,
            }),
          ),
          estimatedTotalDistance: 10050,
          status: "published" as const,
          version: 1,
        };
      });

      const shipment = createShipmentFromBatch(
        selectedBatch.id,
        productDataArray,
        selectedBatch.products.map((p) => p.productId),
      );

      // Update batch with shipment ID
      updateBatch(selectedBatch.id, { shipmentId: shipment.id });

      toast.success(
        <div className="space-y-1">
          <p className="font-medium">Xuất bản lô hàng thành công!</p>
          <p className="text-sm text-muted-foreground">
            Đã tạo vận đơn ({shipment.id}) cho {selectedBatch.products.length}{" "}
            sản phẩm
          </p>
        </div>,
      );

      onClose();
    } catch (error) {
      console.error("Error publishing batch:", error);
      toast.error("Có lỗi xảy ra khi xuất bản lô hàng");
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Quản lý Lô hàng (Batch)
          </DialogTitle>
          <DialogDescription>
            Nhóm nhiều sản phẩm vào 1 lô để xuất khẩu và tạo 1 Shipment chung
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Danh sách ({batches.length})</TabsTrigger>
            <TabsTrigger value="create">Tạo mới</TabsTrigger>
            <TabsTrigger value="detail" disabled={!selectedBatch}>
              Chi tiết{" "}
              {selectedBatch ? `(${selectedBatch.products.length})` : ""}
            </TabsTrigger>
          </TabsList>

          {/* List Tab */}
          <TabsContent value="list" className="flex-1 overflow-auto space-y-3">
            {batches.length === 0 ? (
              <div className="text-center py-8">
                <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Chưa có lô hàng nào</p>
                <Button onClick={() => setActiveTab("create")} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" /> Tạo lô hàng
                </Button>
              </div>
            ) : (
              batches.map((batch) => (
                <Card
                  key={batch.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedBatchId(batch.id);
                    setActiveTab("detail");
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Layers className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{batch.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {batch.totalProducts} sản phẩm •{" "}
                            {batch.totalQuantity.toLocaleString()} đơn vị
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            {batch.totalCO2.toFixed(1)} kg
                          </p>
                          <p className="text-xs text-muted-foreground">
                            CO₂e tổng
                          </p>
                        </div>
                        <Badge
                          className={
                            batch.status === "published"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {batch.status === "published"
                            ? "Đã xuất bản"
                            : "Nháp"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Create Tab */}
          <TabsContent
            value="create"
            className="flex-1 overflow-auto space-y-4"
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tên lô hàng *</label>
                <Input
                  placeholder="VD: Lô xuất EU Q1-2024"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  placeholder="Mô tả lô hàng..."
                  value={newBatchDescription}
                  onChange={(e) => setNewBatchDescription(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Chọn sản phẩm ({selectedProductIds.length} đã chọn)
              </label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-50 overflow-auto space-y-2 border rounded-lg p-2">
                {availableProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => toggleProductSelection(product.id)}
                  >
                    <Checkbox
                      checked={selectedProductIds.includes(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                    />
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.sku}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {product.co2} kg CO₂e
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleCreateBatch} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Tạo lô hàng
            </Button>
          </TabsContent>

          {/* Detail Tab */}
          <TabsContent
            value="detail"
            className="flex-1 overflow-auto space-y-4"
          >
            {selectedBatch && (
              <>
                {/* Batch Info */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">
                          {selectedBatch.name}
                        </h3>
                        {selectedBatch.description && (
                          <p className="text-sm text-muted-foreground">
                            {selectedBatch.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={
                          selectedBatch.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {selectedBatch.status === "published"
                          ? "Đã xuất bản"
                          : "Nháp"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">
                          {selectedBatch.totalProducts}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sản phẩm
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">
                          {selectedBatch.totalQuantity.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Số lượng
                        </p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-2xl font-bold text-primary">
                          {selectedBatch.totalCO2.toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">kg CO₂e</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">
                          {selectedBatch.totalWeight.toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">kg Tổng</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Products in Batch */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">
                      Sản phẩm trong lô ({selectedBatch.products.length})
                    </h4>
                    {selectedBatch.status === "draft" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Show product selection
                          setSearchQuery("");
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Thêm
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-50 overflow-auto">
                    {selectedBatch.products.map((product) => (
                      <div
                        key={product.productId}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <Package className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.sku}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{product.quantity} pcs</p>
                          <p className="text-xs text-muted-foreground">
                            {(product.quantity * product.co2PerUnit).toFixed(1)}{" "}
                            kg CO₂e
                          </p>
                        </div>
                        {selectedBatch.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleRemoveProductFromBatch(product.productId)
                            }
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add more products (only for draft) */}
                  {selectedBatch.status === "draft" && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Thêm sản phẩm</p>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Tìm sản phẩm..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="max-h-37.5 overflow-auto space-y-1">
                        {availableProducts
                          .filter(
                            (p) =>
                              !selectedBatch.products.some(
                                (bp) => bp.productId === p.id,
                              ),
                          )
                          .slice(0, 5)
                          .map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                              onClick={() => handleAddProductToBatch(product)}
                            >
                              <Plus className="w-4 h-4 text-primary" />
                              <span className="text-sm truncate">
                                {product.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs ml-auto"
                              >
                                {product.co2} kg
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {selectedBatch.status === "draft" && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handlePublishBatch}
                      className="w-full"
                      disabled={
                        isPublishing || selectedBatch.products.length === 0
                      }
                    >
                      {isPublishing ? (
                        <>Đang xuất bản...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Xuất bản & Tạo Shipment
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Xuất bản sẽ tạo 1 vận đơn (Shipment) cho toàn bộ lô hàng
                    </p>
                  </div>
                )}

                {selectedBatch.status === "published" &&
                  selectedBatch.shipmentId && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-700">
                            Đã xuất bản
                          </p>
                          <p className="text-xs text-green-600">
                            Vận đơn: {selectedBatch.shipmentId}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BatchManagementModal;
