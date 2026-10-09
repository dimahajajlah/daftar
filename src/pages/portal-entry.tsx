import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { UserCircle } from "lucide-react";

export default function PortalEntry() {
  const [code, setCode] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      setLocation(`/portal/${encodeURIComponent(code.trim())}`);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg border-primary/10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <UserCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">بوابة العميل</h1>
          <p className="text-muted-foreground mt-2">
            أدخل كود العميل الخاص بك للاستعلام عن حسابك.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="كود العميل (مثال: CUST-123)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-14 text-center text-xl font-bold tracking-wider"
              dir="ltr"
              autoFocus
            />
          </div>
          
          <Button type="submit" className="w-full h-14 text-xl font-bold" disabled={!code.trim()}>
            عرض حسابي
          </Button>
        </form>
      </Card>
    </div>
  );
}
