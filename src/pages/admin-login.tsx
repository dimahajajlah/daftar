import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin, getAdminMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const loginMut = useAdminLogin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminMeQueryKey() });
        setLocation("/admin");
      },
      onError: () => {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "كلمة المرور غير صحيحة",
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      loginMut.mutate({ data: { password } });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg border-accent/10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">تسجيل الدخول</h1>
          <p className="text-muted-foreground mt-2">لوحة تحكم الإدارة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-center text-xl"
              dir="ltr"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-xl font-bold bg-accent hover:bg-accent/90"
            disabled={!password || loginMut.isPending}
          >
            {loginMut.isPending ? "جاري الدخول..." : "دخول"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
