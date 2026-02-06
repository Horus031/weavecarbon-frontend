"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Share2,
  QrCode,
  Leaf,
  Shield,
  Copy,
  CheckCircle2,
  Printer,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";

export interface ProductQRCodeProps {
  productId: string;
  productName: string;
  productCode?: string;
  sku?: string;
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
}

const ProductQRCode: React.FC<ProductQRCodeProps> = ({
  productId,
  productName,
  productCode,
  sku,
  open,
  isOpen,
  onClose,
}) => {
  // Support both 'open' and 'isOpen' props, and 'productCode' or 'sku'
  const isDialogOpen = open ?? isOpen ?? false;
  const code = productCode ?? sku ?? productId;
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate the public URL for the Green Passport
  const baseUrl = window.location.origin;
  const passportUrl = `${baseUrl}/passport?id=${productId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(passportUrl);
      setCopied(true);
      toast({
        title: "Đã sao chép",
        description: "Link Green Passport đã được sao chép vào clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép link",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById("product-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 500;

      if (ctx) {
        // White background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR code centered
        const qrSize = 300;
        const qrX = (canvas.width - qrSize) / 2;
        ctx.drawImage(img, qrX, 30, qrSize, qrSize);

        // Add text
        ctx.fillStyle = "#166534";
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Green Passport", canvas.width / 2, 360);

        ctx.fillStyle = "#374151";
        ctx.font = "14px sans-serif";
        ctx.fillText(productName, canvas.width / 2, 390);

        ctx.fillStyle = "#6b7280";
        ctx.font = "12px sans-serif";
        ctx.fillText(`SKU: ${code}`, canvas.width / 2, 415);

        ctx.fillText(
          "Quét mã để xem thông tin sản phẩm",
          canvas.width / 2,
          450,
        );
        ctx.fillText("WeaveCarbon", canvas.width / 2, 480);
      }

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `green-passport-${code}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();

      toast({
        title: "Đã tải xuống",
        description: "QR Code đã được lưu thành công",
      });
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const svg = document.getElementById("product-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Green Passport - ${code}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, sans-serif;
            }
            .container {
              text-align: center;
              padding: 40px;
              border: 2px solid #22c55e;
              border-radius: 16px;
            }
            .title {
              color: #166534;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .product-name {
              font-size: 18px;
              color: #374151;
              margin-top: 20px;
            }
            .sku {
              font-size: 14px;
              color: #6b7280;
              margin-top: 8px;
            }
            .footer {
              font-size: 12px;
              color: #9ca3af;
              margin-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="title">🌿 Green Passport</div>
            ${svgData}
            <div class="product-name">${productName}</div>
            <div class="sku">SKU: ${code}</div>
            <div class="footer">Quét mã để xem thông tin sản phẩm • WeaveCarbon</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Green Passport - ${productName}`,
          text: `Xem thông tin carbon footprint của sản phẩm ${productName}`,
          url: passportUrl,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-green-600" />
            Green Passport QR Code
          </DialogTitle>
          <DialogDescription>
            Mã QR này giống như passport cho sản phẩm - quét để xem nguồn gốc,
            dấu chân carbon và tuân thủ xuất khẩu
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Display */}
          <Card className="bg-linear-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <QRCodeSVG
                  id="product-qr-code"
                  value={passportUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#166534"
                  imageSettings={{
                    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2322c55e'%3E%3Cpath d='M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20c4,0,8.35-5.65,9-8,1-5-2-8-2-8Z'/%3E%3C/svg%3E",
                    height: 30,
                    width: 30,
                    excavate: true,
                  }}
                />
              </div>

              <div className="mt-4 text-center">
                <Badge className="bg-green-100 text-green-700 mb-2">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified Product
                </Badge>
                <h3 className="font-semibold text-sm">{productName}</h3>
                <p className="text-xs text-muted-foreground">SKU: {code}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Tải xuống
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              In
            </Button>
            <Button variant="outline" onClick={handleCopyLink}>
              {copied ? (
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "Đã sao chép" : "Sao chép link"}
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Chia sẻ
            </Button>
          </div>

          {/* Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <Leaf className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>
                <strong>Dành cho khách hàng:</strong> Quét để xem hàng đang ở
                đâu trong chuỗi vận chuyển
              </span>
            </p>
            <p className="flex items-start gap-2 mt-2">
              <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Dành cho thuế quan:</strong> Xác minh nguồn gốc, chứng
                nhận và tuân thủ US/EU
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductQRCode;
