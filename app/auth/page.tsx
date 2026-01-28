import AuthForm from "@/components/ui/AuthForm";
import { AuthProvider } from "@/contexts/AuthContext";

export default function Auth() {
  return (
    <AuthProvider>
      <AuthForm />
    </AuthProvider>
  );
}
