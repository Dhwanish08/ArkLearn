import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClass: string;
  onImportComplete: () => void;
}

interface CSVRow {
  Day: string;
  Subject: string;
  Teacher: string;
  StartTime: string;
  EndTime: string;
  Room: string;
  Type: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const VALID_TYPES = ["subject", "break", "lunch"];
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export default function CSVImportModal({ 
  open, 
  onOpenChange, 
  selectedClass, 
  onImportComplete 
}: CSVImportModalProps) {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      toast.error("Please upload a valid CSV file");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        setCsvData(data);
        setPreviewData(data.slice(0, 10)); // Show first 10 rows for preview
        validateCSVData(data);
        toast.success(`CSV file loaded with ${data.length} rows`);
      },
      error: (error) => {
        toast.error("Error parsing CSV file: " + error.message);
      }
    });
  };

  const validateCSVData = (data: CSVRow[]) => {
    const errors: ValidationError[] = [];
    
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because of 0-based index and header row
      
      // Check required fields
      if (!row.Day) {
        errors.push({ row: rowNumber, field: "Day", message: "Day is required" });
      } else if (!DAYS.includes(row.Day)) {
        errors.push({ row: rowNumber, field: "Day", message: `Invalid day. Must be one of: ${DAYS.join(", ")}` });
      }

      if (!row.StartTime) {
        errors.push({ row: rowNumber, field: "StartTime", message: "Start time is required" });
      } else if (!TIME_REGEX.test(row.StartTime)) {
        errors.push({ row: rowNumber, field: "StartTime", message: "Invalid time format. Use HH:MM (e.g., 08:00)" });
      }

      if (!row.EndTime) {
        errors.push({ row: rowNumber, field: "EndTime", message: "End time is required" });
      } else if (!TIME_REGEX.test(row.EndTime)) {
        errors.push({ row: rowNumber, field: "EndTime", message: "Invalid time format. Use HH:MM (e.g., 09:00)" });
      }

      if (!row.Type) {
        errors.push({ row: rowNumber, field: "Type", message: "Type is required" });
      } else if (!VALID_TYPES.includes(row.Type.toLowerCase())) {
        errors.push({ row: rowNumber, field: "Type", message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` });
      }

      // Subject-specific validations
      if (row.Type.toLowerCase() === "subject") {
        if (!row.Subject) {
          errors.push({ row: rowNumber, field: "Subject", message: "Subject is required for subject type" });
        }
        if (!row.Teacher) {
          errors.push({ row: rowNumber, field: "Teacher", message: "Teacher is required for subject type" });
        }
        if (!row.Room) {
          errors.push({ row: rowNumber, field: "Room", message: "Room is required for subject type" });
        }
      }

      // Time validation
      if (row.StartTime && row.EndTime) {
        const start = new Date(`2000-01-01 ${row.StartTime}`);
        const end = new Date(`2000-01-01 ${row.EndTime}`);
        if (start >= end) {
          errors.push({ row: rowNumber, field: "Time", message: "End time must be after start time" });
        }
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      toast.error("Please fix validation errors before importing");
      return;
    }

    setImporting(true);
    try {
      // Group data by day
      const schedulesByDay: { [key: string]: any[] } = {};
      
      csvData.forEach((row, index) => {
        const day = row.Day;
        if (!schedulesByDay[day]) {
          schedulesByDay[day] = [];
        }

        const period = {
          id: `${day}-${index}`,
          subject: row.Subject || "",
          teacher: row.Teacher || "",
          startTime: row.StartTime,
          endTime: row.EndTime,
          room: row.Room || "",
          type: row.Type.toLowerCase() as "subject" | "break" | "lunch"
        };

        schedulesByDay[day].push(period);
      });

      // Save to Firestore
      const { firestore } = await import("@/lib/firebase");
      const { doc, setDoc } = await import("firebase/firestore");

      for (const [day, periods] of Object.entries(schedulesByDay)) {
        const docRef = doc(firestore, "timetables", `${selectedClass}-${day}`);
        await setDoc(docRef, { periods });
      }

      toast.success("Timetable imported successfully!");
      onImportComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import timetable");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        Day: "Monday",
        Subject: "Mathematics",
        Teacher: "Dr. Sarah Johnson",
        StartTime: "08:00",
        EndTime: "09:00",
        Room: "Room 201",
        Type: "subject"
      },
      {
        Day: "Monday",
        Subject: "",
        Teacher: "",
        StartTime: "09:00",
        EndTime: "09:20",
        Room: "",
        Type: "break"
      },
      {
        Day: "Monday",
        Subject: "Physics",
        Teacher: "Prof. Michael Chen",
        StartTime: "09:20",
        EndTime: "10:20",
        Room: "Lab 1",
        Type: "subject"
      },
      {
        Day: "Monday",
        Subject: "",
        Teacher: "",
        StartTime: "12:20",
        EndTime: "13:20",
        Room: "",
        Type: "lunch"
      }
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timetable-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setCsvData([]);
    setValidationErrors([]);
    setPreviewData([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Timetable from CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                CSV Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Download the CSV template to see the required format
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The template includes example data and shows the correct column structure
                  </p>
                </div>
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm mt-1"
                  />
                </div>
                
                {csvData.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>CSV file loaded with {csvData.length} rows</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  Validation Errors ({validationErrors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Row {error.row}, {error.field}:</span>
                        <span className="text-red-600"> {error.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Preview */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Data Preview (First 10 rows)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Day</th>
                        <th className="text-left p-2">Subject</th>
                        <th className="text-left p-2">Teacher</th>
                        <th className="text-left p-2">Start Time</th>
                        <th className="text-left p-2">End Time</th>
                        <th className="text-left p-2">Room</th>
                        <th className="text-left p-2">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{row.Day}</td>
                          <td className="p-2">{row.Subject}</td>
                          <td className="p-2">{row.Teacher}</td>
                          <td className="p-2">{row.StartTime}</td>
                          <td className="p-2">{row.EndTime}</td>
                          <td className="p-2">{row.Room}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-xs">
                              {row.Type}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CSV Format Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>CSV Format Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Required Columns:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li><strong>Day:</strong> Monday, Tuesday, Wednesday, Thursday, Friday</li>
                    <li><strong>Subject:</strong> Subject name (required for type="subject")</li>
                    <li><strong>Teacher:</strong> Teacher name (required for type="subject")</li>
                    <li><strong>StartTime:</strong> Start time in HH:MM format (e.g., 08:00)</li>
                    <li><strong>EndTime:</strong> End time in HH:MM format (e.g., 09:00)</li>
                    <li><strong>Room:</strong> Room name (required for type="subject")</li>
                    <li><strong>Type:</strong> subject, break, or lunch</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Validation Rules:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• All fields are required except Subject, Teacher, and Room for break/lunch</li>
                    <li>• Time format must be HH:MM (24-hour format)</li>
                    <li>• End time must be after start time</li>
                    <li>• Type must be: subject, break, or lunch</li>
                    <li>• Day must be a valid weekday</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetForm}>
            Reset
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={csvData.length === 0 || validationErrors.length > 0 || importing}
          >
            {importing ? "Importing..." : "Import Timetable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 