import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCreateCustomerTransaction, getGetCustomerQueryKey, getGetAdminSummaryQueryKey, getListRecentTransactionsQueryKey, getListCustomersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  type: "purchase" | "payment";
}

export function TransactionForm({ open, onOpenChange, customerId, type }: TransactionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setDescription("");
    }
  }, [open]);

  const createMut = useCreateCustomerTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(customerId) });
        queryClient.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListRecentTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        toast({ title: type === "purchase" ? "تم تسجيل المشتريات" : "تم تسجيل الدفعة" });
        onOpenChange(false);
      },
      onError: (err: any) => {
        toast({ title: "خطأ", description: err.message || "فشل تسجيل العملية", variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "قيمة غير صحيحة", description: "يجب إدخال مبلغ أكبر من الصفر", variant: "destructive" });
      return;
    }
    
    createMut.mutate({ 
      id: customerId,
      data: { 
        type, 
        amount: numAmount, 
        description: description || undefined 
      } 
    });
  };

  const isPurchase = type === "purchase";
  const title = isPurchase ? "إضافة مشتريات (مديونية جديدة)" : "تسجيل دفعة (سداد)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isPurchase ? "تسجيل مديونية جديدة على العميل." : "تسجيل مبلغ مدفوع من العميل لسداد المديونية."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ (ج.م) <span className="text-destructive">*</span></Label>
            <Input 
              id="amount" 
              type="number" 
              step="0.01" 
              min="0.01" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              required 
              dir="ltr"
              className="text-right text-lg font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">البيان / الملاحظات</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={3} 
              placeholder={isPurchase ? "مثال: بضاعة متنوعة" : "مثال: دفعة نقدية"}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button 
              type="submit" 
              className="w-full sm:w-auto h-12 text-lg" 
              variant={isPurchase ? "destructive" : "default"}
              disabled={createMut.isPending}
            >
              {createMut.isPending ? "جاري الحفظ..." : "حفظ العملية"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
