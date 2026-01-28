"use client";
import {
  BarChart3,
  Globe,
  Leaf,
  Package,
  PieChart,
  Recycle,
  Scale,
  TrendingUp,
  Users,
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Scale className="w-7 h-7" />,
      titleKey: "Carbon Proxy Engine",
      descKey:
        "Calculate CO₂e for products with incomplete supply chain data using proxy emission factors.",
      highlight: true,
    },
    {
      icon: <Package className="w-7 h-7" />,
      titleKey: "Material Database",
      descKey:
        "Access comprehensive emission factors for Cotton, Polyester, Denim, and 50+ other materials.",
    },
    {
      icon: <Globe className="w-7 h-7" />,
      titleKey: "Transport Calculation",
      descKey:
        "Automatic carbon calculation based on production origin and destination shipping routes.",
    },
    {
      icon: <Recycle className="w-7 h-7" />,
      titleKey: "Circular Hub",
      descKey:
        "Connect with recyclers and track the circular journey of your textile waste.",
      highlight: true,
    },
    {
      icon: <Users className="w-7 h-7" />,
      titleKey: "NGO Partnerships",
      descKey:
        "Direct connections to verified charities and recycling partners for maximum social impact.",
    },
    {
      icon: <Leaf className="w-7 h-7" />,
      titleKey: "Carbon Credits",
      descKey:
        "Convert recycled and donated items into verified carbon offsets for your ESG reports.",
    },
    {
      icon: <PieChart className="w-7 h-7" />,
      titleKey: "Export Readiness",
      descKey:
        "Score your compliance for EU, US, and JP export standards with actionable insights.",
      highlight: true,
    },
    {
      icon: <TrendingUp className="w-7 h-7" />,
      titleKey: "Recommendations",
      descKey:
        "AI-powered suggestions to reduce carbon tax and improve supplier sustainability.",
    },
    {
      icon: <BarChart3 className="w-7 h-7" />,
      titleKey: "ESG Reports",
      descKey:
        "Export-ready documentation for audits, customs, and stakeholder communications.",
    },
  ];

  const getLabel = (key: string) => {
    const translated = key;
    return translated !== key ? translated : key;
  };

  return (
    <section id="features" className="py-24 md:py-32 bg-muted/30">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
            Powerful Features for Sustainable Fashion
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to track, reduce, and report your carbon
            emissions
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.titleKey}
              className={`
                group relative p-8 rounded-2xl transition-all duration-300
                ${
                  feature.highlight
                    ? "bg-gradient-forest text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    : "bg-card border border-border hover:border-primary/30 hover:shadow-md"
                }
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`
                  w-14 h-14 rounded-xl flex items-center justify-center mb-5
                  ${
                    feature.highlight
                      ? "bg-primary-foreground/20"
                      : "bg-primary/10 text-primary"
                  }
                `}
              >
                {feature.icon}
              </div>
              <h3
                className={`text-xl font-semibold mb-3 ${feature.highlight ? "" : "text-foreground"}`}
              >
                {getLabel(feature.titleKey)}
              </h3>
              <p
                className={`text-sm leading-relaxed ${feature.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}
              >
                {getLabel(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
