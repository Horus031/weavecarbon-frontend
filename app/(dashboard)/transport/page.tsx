import React from "react";
import TransportClient from "@/components/dashboard/transport/TransportClient";

const TransportLogistics: React.FC = () => {
  // TODO: Get productId from URL params when implementing routing
  // const productId = searchParams.get("productId");
  // const product = productId ? getProduct(productId) : null;

  return (
    <TransportClient
    // productId={product?.id}
    // productName={product?.productName}
    // productCode={product?.productCode}
    // isDemo={product?.isDemo}
    />
  );
};

export default TransportLogistics;
