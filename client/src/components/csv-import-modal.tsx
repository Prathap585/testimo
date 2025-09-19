import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface CsvImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

interface ImportResults {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface ParsedCsvData {
  headers: string[];
  rows: string[][];
}

interface ColumnMapping {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

export default function CsvImportModal({ open, onOpenChange, projectId }: CsvImportModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'processing' | 'results'>('upload');
  const [parsedData, setParsedData] = useState<ParsedCsvData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});

  const downloadTemplateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/clients/import/template`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download template');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clients_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to download template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      
      const response = await fetch(`/api/projects/${projectId}/clients/import`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }
      
      return response.json();
    },
    onSuccess: (results: ImportResults) => {
      setImportResults(results);
      setStep('results');
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "clients"] });
      
      const totalProcessed = results.created + results.updated + results.skipped;
      toast({
        title: "Import completed!",
        description: `Processed ${totalProcessed} records: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
      setStep('upload');
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const parseCSV = (csvText: string): ParsedCsvData => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('Empty CSV file');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );
    
    return { headers, rows };
  };

  const handleFileSelect = async (file: File) => {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      setSelectedFile(file);
      
      // Parse CSV for column mapping
      try {
        const text = await file.text();
        const parsed = parseCSV(text);
        setParsedData(parsed);
        
        // Auto-map columns based on header names
        const autoMapping: ColumnMapping = {};
        parsed.headers.forEach((header) => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('name')) autoMapping.name = header;
          if (lowerHeader.includes('email')) autoMapping.email = header;
          if (lowerHeader.includes('phone')) autoMapping.phone = header;
          if (lowerHeader.includes('company')) autoMapping.company = header;
        });
        setColumnMapping(autoMapping);
        
        setStep('mapping');
      } catch (error) {
        toast({
          title: "Error parsing CSV",
          description: "Unable to parse the CSV file. Please check the format.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!selectedFile || !parsedData) return;
    
    setStep('processing');
    
    // Create CSV with mapped columns
    const mappedHeaders = ['name', 'email', 'phone', 'company'];
    const mappedRows = parsedData.rows.map(row => {
      const mappedRow: string[] = [];
      mappedHeaders.forEach(field => {
        const headerIndex = columnMapping[field as keyof ColumnMapping]
          ? parsedData.headers.indexOf(columnMapping[field as keyof ColumnMapping]!)
          : -1;
        mappedRow.push(headerIndex >= 0 ? row[headerIndex] || '' : '');
      });
      return mappedRow;
    });
    
    // Create new CSV with proper headers
    const csvContent = [mappedHeaders.join(','), ...mappedRows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const mappedFile = new File([blob], selectedFile.name, { type: 'text/csv' });
    
    importCsvMutation.mutate(mappedFile);
  };

  const resetModal = () => {
    setSelectedFile(null);
    setImportResults(null);
    setParsedData(null);
    setColumnMapping({});
    setStep('upload');
    setDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const previewRows = useMemo(() => {
    if (!parsedData) return [];
    return parsedData.rows.slice(0, 5).map(row => {
      return {
        name: columnMapping.name ? row[parsedData.headers.indexOf(columnMapping.name)] || '' : '',
        email: columnMapping.email ? row[parsedData.headers.indexOf(columnMapping.email)] || '' : '',
        phone: columnMapping.phone ? row[parsedData.headers.indexOf(columnMapping.phone)] || '' : '',
        company: columnMapping.company ? row[parsedData.headers.indexOf(columnMapping.company)] || '' : '',
      };
    });
  }, [parsedData, columnMapping]);

  const isValidMapping = columnMapping.name && columnMapping.email;
  const canProceedToPreview = isValidMapping && parsedData;

  const handleClose = (open: boolean) => {
    if (!open) {
      resetModal();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" data-testid="csv-import-modal">
        <DialogHeader>
          <DialogTitle>Import Clients from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import client information to your project.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            {/* Template Download */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Need a template?</p>
                  <p className="text-sm text-muted-foreground">Download our sample CSV with the correct format</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplateMutation.mutate()}
                disabled={downloadTemplateMutation.isPending}
                data-testid="button-download-template"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloadTemplateMutation.isPending ? "Downloading..." : "Download"}
              </Button>
            </div>

            {/* File Upload */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              data-testid="csv-dropzone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                data-testid="file-input"
              />
              
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <p className="font-medium text-primary">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to import
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium">Drop your CSV file here, or click to browse</p>
                  <p className="text-sm text-muted-foreground">
                    Supported format: CSV with columns: name, email, phone, company
                  </p>
                </div>
              )}
            </div>

            {/* CSV Format Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>CSV Format:</strong> Your file should have columns: name (required), email (required), phone (optional), company (optional).
                Existing clients with the same email will be updated.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'mapping' && parsedData && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-medium mb-2">Map CSV Columns</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Map your CSV columns to the required fields. Name and Email are required.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name-mapping">Name (Required)</Label>
                <Select
                  value={columnMapping.name || ""}
                  onValueChange={(value) => setColumnMapping(prev => ({ ...prev, name: value }))}
                >
                  <SelectTrigger data-testid="select-name-mapping">
                    <SelectValue placeholder="Select column for Name" />
                  </SelectTrigger>
                  <SelectContent>
                    {parsedData.headers.map((header) => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email-mapping">Email (Required)</Label>
                <Select
                  value={columnMapping.email || ""}
                  onValueChange={(value) => setColumnMapping(prev => ({ ...prev, email: value }))}
                >
                  <SelectTrigger data-testid="select-email-mapping">
                    <SelectValue placeholder="Select column for Email" />
                  </SelectTrigger>
                  <SelectContent>
                    {parsedData.headers.map((header) => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone-mapping">Phone (Optional)</Label>
                <Select
                  value={columnMapping.phone || ""}
                  onValueChange={(value) => setColumnMapping(prev => ({ ...prev, phone: value }))}
                >
                  <SelectTrigger data-testid="select-phone-mapping">
                    <SelectValue placeholder="Select column for Phone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {parsedData.headers.map((header) => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-mapping">Company (Optional)</Label>
                <Select
                  value={columnMapping.company || ""}
                  onValueChange={(value) => setColumnMapping(prev => ({ ...prev, company: value }))}
                >
                  <SelectTrigger data-testid="select-company-mapping">
                    <SelectValue placeholder="Select column for Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {parsedData.headers.map((header) => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {!isValidMapping && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please map both Name and Email columns to continue.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 'preview' && parsedData && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-medium mb-2">Preview Import Data</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Review the first 5 rows of your mapped data before importing.
              </p>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.name || '-'}</TableCell>
                      <TableCell>{row.email || '-'}</TableCell>
                      <TableCell>{row.phone || '-'}</TableCell>
                      <TableCell>{row.company || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Ready to import {parsedData.rows.length} rows. Existing clients with the same email will be updated.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-4 text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="font-medium">Processing your CSV file...</p>
            <p className="text-sm text-muted-foreground">This may take a moment for larger files</p>
          </div>
        )}

        {step === 'results' && importResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-green-600">{importResults.created}</p>
                <p className="text-sm text-muted-foreground">Created</p>
              </div>
              <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <AlertCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-blue-600">{importResults.updated}</p>
                <p className="text-sm text-muted-foreground">Updated</p>
              </div>
              <div className="text-center p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <XCircle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <p className="font-medium text-yellow-600">{importResults.skipped}</p>
                <p className="text-sm text-muted-foreground">Skipped</p>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-destructive">Errors encountered:</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {importResults.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleClose(false)} data-testid="button-cancel-upload">
              Cancel
            </Button>
          )}
          
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')} data-testid="button-back-to-upload">
                Back
              </Button>
              <Button
                onClick={() => setStep('preview')}
                disabled={!canProceedToPreview}
                data-testid="button-proceed-to-preview"
              >
                Preview Data
              </Button>
            </>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')} data-testid="button-back-to-mapping">
                Back to Mapping
              </Button>
              <Button
                onClick={handleImport}
                data-testid="button-confirm-import"
              >
                Import {parsedData?.rows.length || 0} Clients
              </Button>
            </>
          )}
          
          {step === 'results' && (
            <Button onClick={() => handleClose(false)} data-testid="button-close-results">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}