"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface B2CImagePreviewProps {
  imageData: string;
  onRetake: () => void;
  onContinue: () => void;
}

const B2CImagePreview: React.FC<B2CImagePreviewProps> = ({
  imageData,
  onRetake,
  onContinue
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Captured Image</CardTitle>
      </CardHeader>
      <CardContent>
        <img
          src={imageData}
          alt="Captured"
          className="w-full max-w-md mx-auto rounded-lg" />
        
        <div className="flex gap-2 mt-4 justify-center">
          <Button variant="outline" onClick={onRetake}>
            Retake
          </Button>
          <Button variant="hero" onClick={onContinue}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>);

};

export default B2CImagePreview;