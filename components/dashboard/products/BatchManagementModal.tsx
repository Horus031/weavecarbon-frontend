import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription } from
"@/components/ui/dialog";
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
  CheckCircle2 } from
"lucide-react";
import {
  addProductToBatch,
  createProductBatch,
  fetchAllProducts,
  formatApiErrorMessage,
  getProductBatchById,
  isValidBatchId,
  listProductBatches,
  publishProductBatch,
  removeProductBatchItem,
  type ProductBatchDetail,
  type ProductBatchSummary,
  type ProductRecord } from
"@/lib/productsApi";

interface BatchManagementModalProps {
  open: boolean;
  onClose: () => void;
  initialBatchId?: string;
  onCompleted?: () => void;
}

const BatchManagementModal: React.FC<BatchManagementModalProps> = ({
  open,
  onClose,
  initialBatchId,
  onCompleted
}) => {
  const [batches, setBatches] = useState<ProductBatchSummary[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "create" | "detail">(
    initialBatchId ? "detail" : "list"
  );
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(
    initialBatchId || null
  );
  const [selectedBatchDetail, setSelectedBatchDetail] =
  useState<ProductBatchDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);

  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchDescription, setNewBatchDescription] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const addProductSearchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedBatch = useMemo(() => {
    if (selectedBatchDetail && selectedBatchDetail.id === selectedBatchId) {
      return selectedBatchDetail;
    }

    const summary = batches.find((b) => b.id === selectedBatchId);
    return summary ?
    { ...summary, items: [] } as ProductBatchDetail :
    null;
  }, [batches, selectedBatchId, selectedBatchDetail]);
  const hasSelectedBatchId = Boolean(selectedBatchId);
  const selectedBatchHasValidId = Boolean(selectedBatch && isValidBatchId(selectedBatch.id));
  const resolvedItemCount = selectedBatchDetail ?
  selectedBatchDetail.items.length :
  selectedBatch?.totalProducts ?? 0;

  const loadBatches = useCallback(async () => {
    const result = await listProductBatches({
      page: 1,
      page_size: 100
    });
    setBatches(result.items);
  }, []);

  const loadProducts = useCallback(async () => {
    const data = await fetchAllProducts();
    setProducts(data);
  }, []);

  const loadBatchDetail = useCallback(async (batchId: string) => {
    const normalizedBatchId = batchId.trim();
    if (!normalizedBatchId) {
      setSelectedBatchDetail(null);
      setDetailLoadError("Thiếu ID lô hàng.");
      return;
    }
    if (!isValidBatchId(normalizedBatchId)) {
      setSelectedBatchDetail(null);
      setDetailLoadError("ID lô hàng không hợp lệ.");
      return;
    }

    setDetailLoadError(null);
    setIsDetailLoading(true);
    try {
      const detail = await getProductBatchById(normalizedBatchId);
      setSelectedBatchDetail(detail);
      setDetailLoadError(null);
    } catch (error) {
      setSelectedBatchDetail(null);
      const message = formatApiErrorMessage(error, "Không thể tải chi tiết lô hàng");
      setDetailLoadError(message);
      toast.error(message);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const init = async () => {
      setIsLoading(true);
      try {
        const [batchResult, productResult] = await Promise.all([
        listProductBatches({ page: 1, page_size: 100 }),
        fetchAllProducts()]
        );

        if (cancelled) return;

        setBatches(batchResult.items);
        setProducts(productResult);

        const targetBatchId = initialBatchId?.trim();
        if (targetBatchId) {
          setSelectedBatchId(targetBatchId);
          setActiveTab("detail");
          if (!cancelled) {
            if (isValidBatchId(targetBatchId)) {
              await loadBatchDetail(targetBatchId);
            } else {
              setSelectedBatchDetail(null);
              setDetailLoadError("ID lô hàng không hợp lệ.");
            }
          }
        } else if (!cancelled) {
          setSelectedBatchId(null);
          setSelectedBatchDetail(null);
          setDetailLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(formatApiErrorMessage(error, "Không thể tải dữ liệu lô hàng"));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [open, initialBatchId, loadBatchDetail]);

  const searchedProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
      product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [products, searchQuery]);
  const availableProducts = searchedProducts;
  const addableProducts = useMemo(() => {
    if (!selectedBatch) return [];
    return availableProducts.filter(
      (product) => !selectedBatch.items.some((item) => item.productId === product.id)
    );
  }, [availableProducts, selectedBatch]);

  const handleCreateBatch = async () => {
    if (!newBatchName.trim()) {
      toast.error("Vui lòng nhập tên lô hàng");
      return;
    }

    try {
      setIsLoading(true);
      const batch = await createProductBatch({
        name: newBatchName.trim(),
        description: newBatchDescription.trim() || undefined
      });

      if (selectedProductIds.length > 0) {
        const selectedProducts = selectedProductIds.
        map((productId) => products.find((item) => item.id === productId)).
        filter((product): product is ProductRecord => Boolean(product));
        let addedCount = 0;
        let failedCount = 0;

        for (const product of selectedProducts) {
          try {
            await addProductToBatch(batch.id, {
              product_id: product.id,
              quantity: product.quantity > 0 ? product.quantity : 1,
              weight_kg:
              product.weightPerUnit > 0 ?
              Number((product.weightPerUnit / 1000).toFixed(4)) :
              undefined,
              co2_per_unit:
              product.carbonResults?.perProduct.total !== undefined ?
              Number(product.carbonResults.perProduct.total.toFixed(4)) :
              undefined
            });
            addedCount += 1;
          } catch {
            failedCount += 1;
          }
        }

        if (failedCount > 0) {
          toast.warning(
            `Đã tạo lô hàng, nhưng ${failedCount}/${selectedProducts.length} sản phẩm chưa thêm được.`
          );
        } else if (addedCount > 0) {
          toast.success(`Đã thêm ${addedCount} sản phẩm vào lô hàng.`);
        }
      }

      await Promise.all([loadBatches(), loadProducts()]);
      await loadBatchDetail(batch.id);

      setNewBatchName("");
      setNewBatchDescription("");
      setSelectedProductIds([]);
      setSelectedBatchId(batch.id);
      setActiveTab("detail");

      onCompleted?.();
      toast.success(`Đã tạo lô hàng "${batch.name}"`);
    } catch (error) {
      toast.error(formatApiErrorMessage(error, "Tạo lô hàng thất bại"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProductToBatch = async (product: ProductRecord) => {
    if (!selectedBatchId) return;
    if (!isValidBatchId(selectedBatchId)) {
      toast.error("ID lô hàng không hợp lệ, không thể cập nhật.");
      return;
    }

    try {
      await addProductToBatch(selectedBatchId, {
        product_id: product.id,
        quantity: product.quantity > 0 ? product.quantity : 1,
        weight_kg:
        product.weightPerUnit > 0 ?
        Number((product.weightPerUnit / 1000).toFixed(4)) :
        undefined,
        co2_per_unit:
        product.carbonResults?.perProduct.total !== undefined ?
        Number(product.carbonResults.perProduct.total.toFixed(4)) :
        undefined
      });

      await Promise.all([loadBatchDetail(selectedBatchId), loadBatches()]);
      onCompleted?.();
      toast.success(`Đã thêm "${product.productName}" vào lô hàng`);
    } catch (error) {
      toast.error(formatApiErrorMessage(error, "Thêm sản phẩm vào lô hàng thất bại"));
    }
  };

  const handleRemoveProductFromBatch = async (productId: string) => {
    if (!selectedBatchId) return;
    if (!isValidBatchId(selectedBatchId)) {
      toast.error("ID lô hàng không hợp lệ, không thể cập nhật.");
      return;
    }

    try {
      await removeProductBatchItem(selectedBatchId, productId);
      await Promise.all([loadBatchDetail(selectedBatchId), loadBatches()]);
      onCompleted?.();
      toast.success("Đã xóa sản phẩm khỏi lô hàng");
    } catch (error) {
      toast.error(formatApiErrorMessage(error, "Xóa sản phẩm khỏi lô hàng thất bại"));
    }
  };

  const handlePublishBatch = async () => {
    if (!selectedBatch || resolvedItemCount === 0) {
      toast.error("Lô hàng cần có ít nhất 1 sản phẩm");
      return;
    }

    if (!selectedBatchId) return;
    if (!isValidBatchId(selectedBatchId)) {
      toast.error("ID lô hàng không hợp lệ, không thể xuất bản.");
      return;
    }

    setIsPublishing(true);

    try {
      const publishResult = await publishProductBatch(selectedBatchId);
      await Promise.all([loadBatchDetail(selectedBatchId), loadBatches()]);
      onCompleted?.();

      toast.success(
        publishResult.message || (
        publishResult.shipmentId ?
        `Xuất bản lô hàng thành công. Shipment: ${publishResult.shipmentId}` :
        "Xuất bản lô hàng thành công")
      );
    } catch (error) {
      toast.error(formatApiErrorMessage(error, "Xuất bản lô hàng thất bại"));
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
    prev.includes(productId) ?
    prev.filter((id) => id !== productId) :
    [...prev, productId]
    );
  };

  const setProductSelection = (productId: string, checked: boolean) => {
    setSelectedProductIds((prev) => {
      if (checked) {
        return prev.includes(productId) ? prev : [...prev, productId];
      }
      return prev.filter((id) => id !== productId);
    });
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
          onValueChange={(value) => setActiveTab(value as "list" | "create" | "detail")}
          className="flex-1 overflow-hidden flex flex-col">

          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Danh sách ({batches.length})</TabsTrigger>
            <TabsTrigger value="create">Tạo mới</TabsTrigger>
            <TabsTrigger
              value="detail"
              disabled={!hasSelectedBatchId}>

              Chi tiết {selectedBatch ? `(${resolvedItemCount})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="flex-1 overflow-auto space-y-3">
            {isLoading ?
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) =>
              <Card key={index}>
                    <CardContent className="p-4">
                      <div className="h-5 w-1/3 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                    </CardContent>
                  </Card>
              )}
              </div> :
            batches.length === 0 ?
            <div className="text-center py-8">
                <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Chưa có lô hàng nào</p>
                <Button onClick={() => setActiveTab("create")} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" /> Tạo lô hàng
                </Button>
              </div> :

            batches.map((batch) =>
            <Card
              key={batch.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedBatchId(batch.id);
                setDetailLoadError(null);
                setActiveTab("detail");
                if (isValidBatchId(batch.id)) {
                  void loadBatchDetail(batch.id);
                } else {
                  setSelectedBatchDetail(null);
                }
              }}>

                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Layers className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{batch.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {batch.totalProducts} sản phẩm • {batch.totalQuantity.toLocaleString()} đơn vị
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-primary">{batch.totalCO2.toFixed(1)} kg</p>
                          <p className="text-xs text-muted-foreground">CO2e tổng</p>
                        </div>
                        <Badge
                      className={
                      batch.status === "published" ?
                      "bg-green-100 text-green-700" :
                      batch.status === "archived" ?
                      "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                      }>

                          {batch.status === "published" ?
                      "Đã xuất bản" :
                      batch.status === "archived" ?
                      "Archived" :
                      "Nháp"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            )
            }
          </TabsContent>

          <TabsContent value="create" className="flex-1 overflow-auto space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tên lô hàng *</label>
                <Input
                  placeholder="VD: Lô xuất EU Q1-2026"
                  value={newBatchName}
                  onChange={(event) => setNewBatchName(event.target.value)}
                  className="mt-1" />

              </div>
              <div>
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  placeholder="Mô tả lô hàng..."
                  value={newBatchDescription}
                  onChange={(event) => setNewBatchDescription(event.target.value)}
                  className="mt-1"
                  rows={2} />

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
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10" />

              </div>

              <div className="max-h-50 overflow-auto space-y-2 border rounded-lg p-2">
                {availableProducts.map((product) =>
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                  onClick={() => toggleProductSelection(product.id)}>

                    <Checkbox
                    checked={selectedProductIds.includes(product.id)}
                    onClick={(event) => event.stopPropagation()}
                    onCheckedChange={(checked) =>
                    setProductSelection(product.id, checked === true)
                    } />

                    <Package className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.productName}</p>
                      <p className="text-xs text-muted-foreground">{product.productCode}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {(product.carbonResults?.perProduct.total ?? 0).toFixed(2)} kg CO2e
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={() => void handleCreateBatch()} className="w-full" disabled={isLoading}>
              <Plus className="w-4 h-4 mr-2" /> Tạo lô hàng
            </Button>
          </TabsContent>

          <TabsContent value="detail" className="flex-1 overflow-auto space-y-4">
            {selectedBatch &&
            <>
                {!selectedBatchHasValidId &&
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    ID lô hàng không đúng định dạng, nên chỉ hiển thị thông tin tổng quan.
                  </div>
              }
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{selectedBatch.name}</h3>
                        {selectedBatch.description &&
                      <p className="text-sm text-muted-foreground">{selectedBatch.description}</p>
                      }
                      </div>
                      <Badge
                      className={
                      selectedBatch.status === "published" ?
                      "bg-green-100 text-green-700" :
                      selectedBatch.status === "archived" ?
                      "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                      }>

                        {selectedBatch.status === "published" ?
                      "Đã xuất bản" :
                      selectedBatch.status === "archived" ?
                      "Archived" :
                      "Nháp"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{selectedBatch.totalProducts}</p>
                        <p className="text-xs text-muted-foreground">Sản phẩm</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{selectedBatch.totalQuantity.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Số lượng</p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{selectedBatch.totalCO2.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">kg CO2e</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{selectedBatch.totalWeight.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">kg tổng</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Sản phẩm trong lô ({resolvedItemCount})</h4>
                    {selectedBatch.status === "draft" && selectedBatchHasValidId &&
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      requestAnimationFrame(() => {
                        addProductSearchInputRef.current?.focus();
                        addProductSearchInputRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "center"
                        });
                      });
                    }}>

                        <Plus className="w-4 h-4 mr-1" /> Thêm
                      </Button>
                  }
                  </div>

                  {isDetailLoading ?
                <div className="p-6 text-center text-sm text-muted-foreground">Đang tải chi tiết lô hàng...</div> :
                selectedBatchDetail ?
                <div className="space-y-2 max-h-50 overflow-auto">
                      {selectedBatch.items.map((item) =>
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 p-3 border rounded-lg">

                          <Package className="w-5 h-5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">{item.productCode}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.quantity} pcs</p>
                            <p className="text-xs text-muted-foreground">
                              {(item.quantity * item.co2PerUnit).toFixed(1)} kg CO2e
                            </p>
                          </div>
                          {selectedBatch.status === "draft" && selectedBatchHasValidId &&
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleRemoveProductFromBatch(item.productId)}>

                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                    }
                        </div>
                  )}
                    </div> :
                detailLoadError ?
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Không tải được danh sách chi tiết sản phẩm trong lô.
                      <div className="mt-1 text-xs text-amber-700">{detailLoadError}</div>
                    </div> :

                <div className="space-y-2 max-h-50 overflow-auto">
                      <div className="p-3 text-sm text-muted-foreground">
                        Chưa có dữ liệu chi tiết sản phẩm.
                      </div>
                    </div>
                }

                  {selectedBatch.status === "draft" && selectedBatchHasValidId &&
                <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Thêm sản phẩm</p>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                      ref={addProductSearchInputRef}
                      placeholder="Tìm sản phẩm..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="pl-10" />

                      </div>
                      <div className="max-h-37.5 overflow-auto space-y-1">
                        {addableProducts.length === 0 &&
                    <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                            Không còn sản phẩm phù hợp để thêm vào lô hàng.
                          </div>
                    }
                        {addableProducts.slice(0, 5).map((product) =>
                    <div
                      key={product.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => void handleAddProductToBatch(product)}>

                            <Plus className="w-4 h-4 text-primary" />
                            <span className="text-sm truncate">{product.productName}</span>
                            <Badge variant="outline" className="text-xs ml-auto">
                              {(product.carbonResults?.perProduct.total ?? 0).toFixed(2)} kg
                            </Badge>
                          </div>
                    )}
                      </div>
                    </div>
                }
                </div>

                {selectedBatch.status === "draft" && selectedBatchHasValidId &&
              <div className="pt-4 border-t">
                    <Button
                  onClick={() => void handlePublishBatch()}
                  className="w-full"
                  disabled={isPublishing || resolvedItemCount === 0}>

                      {isPublishing ?
                  <>Đang xuất bản...</> :

                  <>
                          <Send className="w-4 h-4 mr-2" />
                          Xuất bản & Tạo Shipment
                        </>
                  }
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Xuất bản sẽ tạo 1 vận đơn (Shipment) cho toàn bộ lô hàng
                    </p>
                  </div>
              }

                {selectedBatch.status === "published" && selectedBatch.shipmentId &&
              <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-700">Đã xuất bản</p>
                        <p className="text-xs text-green-600">Vận đơn: {selectedBatch.shipmentId}</p>
                      </div>
                    </div>
                  </div>
              }
              </>
            }
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>);

};

export default BatchManagementModal;