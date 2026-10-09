import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCreateCustomer, useUpdateCustomer, getListCustomersQueryKey, getGetCustomerQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: {
    id: number;
    code: string;
    name: string;
    phone?: string | null;
    notes?: string | null;
  };
}

export function CustomerForm({ open, onOpenChange, customer }: CustomerFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!customer;

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      if (customer) {
        setCode(customer.code);
        setName(customer.name);
        setPhone(customer.phone || "");
        setNotes(customer.notes || "");
      } else {
        setCode("");
        setName("");
        setPhone("");
        setNotes("");
      }
    }
  }, [open, customer]);

  const createMut = useCreateCustomer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        toast({ title: "تم إضافة العميل بنجاح" });
        onOpenChange(false);
      },
      onError: (err: any) => {
        toast({ title: "خطأ", description: err.message || "فشل إضافة العميل", variant: "destructive" });
      }
    }
  });

  const updateMut = useUpdateCustomer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        if (customer) {
          queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(customer.id) });
        }
        toast({ title: "تم تحديث العميل بنجاح" });
        onOpenChange(false);
      },
      onError: (err: any) => {
        toast({ title: "خطأ", description: err.message || "فشل تحديث العميل", variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { code, name, phone: phone || undefined, notes: notes || undefined };
    if (isEditing && customer) {
      updateMut.mutate({ id: customer.id, data });
    } else {
      createMut.mutate({ data });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "تعديل بيانات العميل" : "إضافة عميل جديد"}</DialogTitle>
          <DialogDescription>
            أدخل بيانات العميل. يجب أن يكون الكود فريداً.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="code">الكود <span className="text-destructive">*</span></Label>
            <Input id="code" value={code} onChange={e => setCode(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">الاسم <span className="text-destructive">*</span></Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" className="text-right" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
