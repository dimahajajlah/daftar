import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useImportBulk, getListCustomersQueryKey, getGetAdminSummaryQueryKey, getListRecentTransactionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileDown, FileSpreadsheet, FileWarning, AlertCircle, CheckCircle2 } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export default function AdminImport() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [parsed, setParsed] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMut = useImportBulk({
    mutation: {
      onSuccess: (data) => {
        setImportResult(data);
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListRecentTransactionsQueryKey() });
        toast({ title: "تم الاستيراد بنجاح" });
      },
      onError: (err: any) => {
        toast({ title: "فشل الاستيراد", description: err.message || "حدث خطأ أثناء استيراد البيانات", variant: "destructive" });
      }
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    setFile(selected);
    setRows([]);
    setParsed(false);
    setImportResult(null);
    
    const ext = selected.name.split('.').pop()?.toLowerCase();
    
    if (ext === 'csv') {
      Papa.parse(selected, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          setRows(results.data);
          setParsed(true);
        },
        error: () => {
          toast({ title: "خطأ", description: "فشل قراءة ملف CSV", variant: "destructive" });
        }
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          setRows(data);
          setParsed(true);
        } catch (err) {
          toast({ title: "خطأ", description: "فشل قراءة ملف Excel", variant: "destructive" });
        }
      };
      reader.readAsBinaryString(selected);
    } else {
      toast({ title: "صيغة غير مدعومة", description: "يرجى اختيار ملف CSV أو Excel", variant: "destructive" });
    }
  };

  const processImport = () => {
    if (!parsed || rows.length === 0) return;
    
    // Map headers to schema
    const mappedRows = rows.map((row: any) => {
      const code = row['الكود'] || row['code'] || '';
      const name = row['الاسم'] || row['name'] || '';
      const phone = row['الهاتف'] || row['phone'] || null;
      const notes = row['ملاحظات'] || row['notes'] || null;
      
      const rawType = (row['النوع'] || row['type'] || '').toString().toLowerCase();
      let type: 'purchase' | 'payment' | undefined = undefined;
      if (rawType === 'شراء' || rawType === 'purchase') type = 'purchase';
      if (rawType === 'دفعة' || rawType === 'payment') type = 'payment';
      
      const rawAmount = row['المبلغ'] || row['amount'];
      const amount = rawAmount ? parseFloat(rawAmount) : undefined;
      
      const description = row['الوصف'] || row['description'] || undefined;
      
      let occurredAt = row['التاريخ'] || row['occurredAt'] || undefined;
      if (occurredAt) {
        // Simple attempt to ensure it's ISO, if it fails it might just be sent as is
        try {
          const d = new Date(occurredAt);
          if (!isNaN(d.getTime())) {
            occurredAt = d.toISOString();
          }
        } catch(e) {}
      }

      return {
        code: String(code),
        name: String(name),
        phone: phone ? String(phone) : undefined,
        notes: notes ? String(notes) : undefined,
        type,
        amount: isNaN(amount as number) ? undefined : amount,
        description: description ? String(description) : undefined,
        occurredAt: occurredAt ? String(occurredAt) : undefined,
      };
    });

    importMut.mutate({ data: { rows: mappedRows } });
  };

  const downloadTemplate = () => {
    const csvContent = "\uFEFFالكود,الاسم,الهاتف,ملاحظات,النوع,المبلغ,الوصف,التاريخ\nC001,أحمد محمد,01012345678,عميل ممتاز,شراء,150.50,بضاعة,2023-10-01T10:00:00Z\nC002,محمود علي,,بدون ملاحظات,دفعة,50.00,سداد جزء من المديونية,2023-10-02T12:00:00Z\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "قالب_استيراد_العملاء.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setFile(null);
    setRows([]);
    setParsed(false);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">استيراد البيانات</h1>
          <p className="text-muted-foreground mt-1">قم باستيراد العملاء والعمليات من ملف CSV أو Excel.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={downloadTemplate}>
          <FileDown className="w-4 h-4" />
          تنزيل قالب CSV
        </Button>
      </div>

      {!importResult ? (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-12 text-center hover:bg-muted/30 transition-colors">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden" 
              id="file-upload" 
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <FileSpreadsheet className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">اختر ملف الاستيراد</h3>
              <p className="text-muted-foreground mb-6">يدعم ملفات CSV و XLSX</p>
              <Button asChild>
                <span>استعراض الملفات</span>
              </Button>
            </label>
            {file && (
              <div className="mt-6 pt-4 border-t border-border w-full">
                <p className="font-medium text-primary">الملف المحدد: {file.name}</p>
                <p className="text-sm text-muted-foreground mt-1">عدد الصفوف المقروءة: {rows.length}</p>
              </div>
            )}
          </div>

          {parsed && rows.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">معاينة البيانات (أول 5 صفوف)</h3>
                <Button onClick={processImport} disabled={importMut.isPending} className="gap-2">
                  <Upload className="w-4 h-4" />
                  {importMut.isPending ? "جاري الاستيراد..." : `استيراد ${rows.length} صف`}
                </Button>
              </div>
              
              <div className="overflow-x-auto border border-border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(rows[0] || {}).map((header, i) => (
                        <TableHead key={i}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {Object.values(row).map((val: any, j) => (
                          <TableCell key={j}>{String(val)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">اكتمل الاستيراد</h2>
            <p className="text-muted-foreground">تم معالجة الملف بنجاح.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto text-right">
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="text-muted-foreground text-sm">عملاء جدد</div>
              <div className="text-2xl font-bold">{importResult.createdCustomers}</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="text-muted-foreground text-sm">عملاء تم تحديثهم</div>
              <div className="text-2xl font-bold">{importResult.updatedCustomers}</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="text-muted-foreground text-sm">عمليات مضافة</div>
              <div className="text-2xl font-bold">{importResult.createdTransactions}</div>
            </div>
            <div className="bg-destructive/10 p-4 rounded-lg">
              <div className="text-destructive text-sm">أخطاء</div>
              <div className="text-2xl font-bold text-destructive">{importResult.errors.length}</div>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mt-8 text-right bg-destructive/5 border border-destructive/20 rounded-lg p-4 max-h-60 overflow-y-auto">
              <h4 className="font-bold text-destructive mb-3 flex items-center gap-2">
                <FileWarning className="w-5 h-5" />
                تفاصيل الأخطاء
              </h4>
              <ul className="space-y-2">
                {importResult.errors.map((err: any, i: number) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="font-bold">صف {err.row}:</span>
                    <span>{err.error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-6">
            <Button onClick={resetForm} variant="outline">استيراد ملف آخر</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
