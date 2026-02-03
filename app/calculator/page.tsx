import CalculatorClient from "@/components/calculator/CalculatorClient";
import { AuthProvider } from "@/contexts/AuthContext";

export default function CalculatorPage() {
  return (
    <AuthProvider>
      <CalculatorClient />;
    </AuthProvider>
  );
}
