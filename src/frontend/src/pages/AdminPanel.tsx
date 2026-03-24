import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Filter,
  Loader2,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../App";
import type { AttendanceRecord } from "../backend.d";
import {
  useClearAttendanceLogs,
  useGetAllAttendance,
  useGetAllEmployees,
} from "../hooks/useQueries";

function StatusChip({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "present")
    return (
      <span className="chip-success text-xs font-semibold px-2.5 py-1 rounded-full">
        {status}
      </span>
    );
  return (
    <span className="chip-absent text-xs font-semibold px-2.5 py-1 rounded-full">
      {status}
    </span>
  );
}

function exportToCSV(records: AttendanceRecord[]) {
  const headers = [
    "Employee ID",
    "Name",
    "Department",
    "Date",
    "Time In",
    "Status",
  ];
  const rows = records.map((r) => [
    `"${r.employeeId}"`,
    `"${r.employeeName}"`,
    `"${r.department}"`,
    `"${r.date}"`,
    `"${r.timeIn}"`,
    `"${r.status}"`,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `attendance_export_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminPanel() {
  const { data: allAttendance, isLoading } = useGetAllAttendance();
  const { data: employees } = useGetAllEmployees();
  const clearLogs = useClearAttendanceLogs();

  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!allAttendance) return [];
    return allAttendance.filter((r) => {
      const matchSearch =
        !search ||
        r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(search.toLowerCase());
      const matchDate = !filterDate || r.date === filterDate;
      const matchStatus =
        filterStatus === "all" || r.status.toLowerCase() === filterStatus;
      const matchEmp =
        filterEmployee === "all" || r.employeeId === filterEmployee;
      return matchSearch && matchDate && matchStatus && matchEmp;
    });
  }, [allAttendance, search, filterDate, filterStatus, filterEmployee]);

  async function handleClear() {
    try {
      await clearLogs.mutateAsync();
      toast.success("Attendance logs cleared.");
      setClearConfirmOpen(false);
    } catch {
      toast.error("Failed to clear logs.");
    }
  }

  return (
    <div data-ocid="admin.page">
      <PageHeader title="Admin Panel" breadcrumb={["Home", "Admin", "Panel"]} />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-card border-0">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Records</p>
            <p className="text-3xl font-bold">{allAttendance?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">
              Total Employees
            </p>
            <p className="text-3xl font-bold">{employees?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">
              Filtered Results
            </p>
            <p className="text-3xl font-bold">{filtered.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-sm font-semibold">
              Attendance Logs
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportToCSV(filtered)}
                disabled={filtered.length === 0}
                data-ocid="admin.primary_button"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setClearConfirmOpen(true)}
                data-ocid="admin.delete_button"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear All
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search name or ID..."
                className="pl-9 h-8 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-ocid="admin.search_input"
              />
            </div>
            <div>
              <Input
                type="date"
                className="h-8 text-xs"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                data-ocid="admin.input"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs" data-ocid="admin.select">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger className="h-8 text-xs" data-ocid="admin.select">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees?.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2" data-ocid="admin.loading_state">
              {["s1", "s2", "s3", "s4", "s5"].map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12"
              data-ocid="admin.empty_state"
            >
              <Filter className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                No records match your filters
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table data-ocid="admin.table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Emp ID</TableHead>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Department</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Time In</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, i) => (
                    <TableRow key={r.id} data-ocid={`admin.item.${i + 1}`}>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {r.employeeId}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {r.employeeName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.department}
                      </TableCell>
                      <TableCell className="text-xs">{r.date}</TableCell>
                      <TableCell className="text-xs">{r.timeIn}</TableCell>
                      <TableCell>
                        <StatusChip status={r.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear confirm */}
      <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <DialogContent data-ocid="admin.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              Clear All Attendance Logs
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete all{" "}
            <strong>{allAttendance?.length ?? 0}</strong> attendance records.
            This action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setClearConfirmOpen(false)}
              data-ocid="admin.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClear}
              disabled={clearLogs.isPending}
              data-ocid="admin.confirm_button"
            >
              {clearLogs.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Yes, Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
