"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Calculator,
  Leaf,
  Factory,
  Truck,
  Package,
  ArrowLeft,
  Info,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

// Emission factors (kg CO2e per kg of material)
const materialFactors: Record<string, number> = {
  cotton: 5.9,
  polyester: 6.4,
  wool: 10.1,
  silk: 8.5,
  linen: 1.5,
  recycledPoly: 2.1,
  organicCotton: 3.8,
};

// Transport emission factors (kg CO2e per kg per km)
const routeEmissions: Record<string, { distance: number; factor: number }> = {
  vnEu: { distance: 15000, factor: 0.00016 },
  vnUs: { distance: 12500, factor: 0.00016 },
  vnJp: { distance: 3800, factor: 0.00016 },
  vnDomestic: { distance: 500, factor: 0.00025 },
  vnKr: { distance: 3200, factor: 0.00016 },
};

// Additional factors
const manufacturingFactor = 2.5; // kg CO2e per kg
const packagingFactor = 0.3; // kg CO2e per kg

interface EmissionBreakdown {
  material: number;
  manufacturing: number;
  transport: number;
  packaging: number;
  total: number;
}

const MATERIALS = [
  { value: "cotton", label: "Cotton" },
  { value: "polyester", label: "Polyester" },
  { value: "wool", label: "Wool" },
  { value: "silk", label: "Silk" },
  { value: "linen", label: "Linen" },
  { value: "recycledPoly", label: "Recycled Polyester" },
  { value: "organicCotton", label: "Organic Cotton" },
];

const ROUTES = [
  { value: "vnEu", label: "Vietnam → EU" },
  { value: "vnUs", label: "Vietnam → US" },
  { value: "vnJp", label: "Vietnam → Japan" },
  { value: "vnDomestic", label: "Vietnam Domestic" },
  { value: "vnKr", label: "Vietnam → Korea" },
];

export default function CalculatorClient() {
  const [weight, setWeight] = useState<string>("");
  const [material, setMaterial] = useState<string>("");
  const [route, setRoute] = useState<string>("");
  const [emissions, setEmissions] = useState<EmissionBreakdown | null>(null);

  const calculateEmissions = () => {
    if (!weight || !material || !route) return;

    const weightNum = parseFloat(weight);
    const materialEmission = weightNum * materialFactors[material];
    const manufacturingEmission = weightNum * manufacturingFactor;
    const routeData = routeEmissions[route];
    const transportEmission = weightNum * routeData.distance * routeData.factor;
    const packagingEmission = weightNum * packagingFactor;
    const total =
      materialEmission +
      manufacturingEmission +
      transportEmission +
      packagingEmission;

    setEmissions({
      material: materialEmission,
      manufacturing: manufacturingEmission,
      transport: transportEmission,
      packaging: packagingEmission,
      total,
    });
  };

  const getPercentage = (value: number, total: number) => (value / total) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Calculator className="w-4 h-4" />
              <span className="text-sm font-medium">Carbon Proxy Engine</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Carbon Calculator
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Calculate CO₂e emissions for your fashion products
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Calculator Form */}
            <Card className="border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-primary" />
                  </div>
                  Carbon Calculator
                </CardTitle>
                <CardDescription>
                  Using proxy emission factors for incomplete supply chain data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Weight Input */}
                <div className="space-y-2">
                  <Label htmlFor="weight">Product Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="bg-background"
                  />
                </div>

                {/* Material Select */}
                <div className="space-y-2">
                  <Label>Material Type</Label>
                  <Select value={material} onValueChange={setMaterial}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select material type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIALS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shipping Route Select */}
                <div className="space-y-2">
                  <Label>Shipping Route</Label>
                  <Select value={route} onValueChange={setRoute}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select shipping route" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="hero"
                  className="w-full"
                  onClick={calculateEmissions}
                  disabled={!weight || !material || !route}
                >
                  Calculate Emissions
                </Button>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Using proxy emission factors for incomplete supply chain
                    data
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card
              className={`border-border/50 shadow-soft transition-all duration-300 ${emissions ? "opacity-100" : "opacity-50"}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-accent-foreground" />
                  </div>
                  Estimated CO₂e Emissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emissions ? (
                  <div className="space-y-6">
                    {/* Total Emissions */}
                    <div className="text-center p-6 rounded-2xl bg-gradient-forest text-primary-foreground">
                      <p className="text-sm font-medium opacity-80 mb-2">
                        Estimated CO₂e Emissions
                      </p>
                      <p className="text-5xl font-display font-bold mb-1">
                        {emissions.total.toFixed(2)}
                      </p>
                      <p className="text-sm opacity-80">kg CO₂e</p>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">
                        Emissions Breakdown
                      </h4>

                      {/* Material */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Leaf className="w-4 h-4" />
                            Material Production
                          </span>
                          <span className="font-medium text-foreground">
                            {emissions.material.toFixed(2)} kg CO₂e
                          </span>
                        </div>
                        <Progress
                          value={getPercentage(
                            emissions.material,
                            emissions.total,
                          )}
                          className="h-2"
                        />
                      </div>

                      {/* Manufacturing */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Factory className="w-4 h-4" />
                            Manufacturing
                          </span>
                          <span className="font-medium text-foreground">
                            {emissions.manufacturing.toFixed(2)} kg CO₂e
                          </span>
                        </div>
                        <Progress
                          value={getPercentage(
                            emissions.manufacturing,
                            emissions.total,
                          )}
                          className="h-2"
                        />
                      </div>

                      {/* Transport */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Truck className="w-4 h-4" />
                            Transport
                          </span>
                          <span className="font-medium text-foreground">
                            {emissions.transport.toFixed(2)} kg CO₂e
                          </span>
                        </div>
                        <Progress
                          value={getPercentage(
                            emissions.transport,
                            emissions.total,
                          )}
                          className="h-2"
                        />
                      </div>

                      {/* Packaging */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Package className="w-4 h-4" />
                            Packaging
                          </span>
                          <span className="font-medium text-foreground">
                            {emissions.packaging.toFixed(2)} kg CO₂e
                          </span>
                        </div>
                        <Progress
                          value={getPercentage(
                            emissions.packaging,
                            emissions.total,
                          )}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <p className="text-center">
                      Fill in the form and click calculate
                      <br />
                      to see your emissions breakdown
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
