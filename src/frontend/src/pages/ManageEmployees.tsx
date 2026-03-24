import { Badge } from "@/components/ui/badge";
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
import { Loader2, Pencil, Search, Trash2, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../App";
import type { Employee } from "../backend.d";
import {
  useAddEmployee,
  useDeleteEmployee,
  useGetAllEmployees,
  useUpdateEmployee,
} from "../hooks/useQueries";

const DEPARTMENTS = [
  "Engineering",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "Design",
  "Legal",
];

type FormState = { name: string; employeeIdCode: string; department: string };
const emptyForm: FormState = { name: "", employeeIdCode: "", department: "" };

export default function ManageEmployees() {
  const { data: employees, isLoading } = useGetAllEmployees();
  const addEmployee = useAddEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filtered = (employees ?? []).filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeIdCode.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()),
  );

  function openAdd() {
    setForm(emptyForm);
    setAddOpen(true);
  }

  function openEdit(emp: Employee) {
    setForm({
      name: emp.name,
      employeeIdCode: emp.employeeIdCode,
      department: emp.department,
    });
    setEditTarget(emp);
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.employeeIdCode.trim() || !form.department) {
      toast.error("Please fill in all fields.");
      return;
    }
    const duplicate = employees?.find(
      (e) => e.employeeIdCode === form.employeeIdCode,
    );
    if (duplicate) {
      toast.error("Employee ID already exists.");
      return;
    }
    try {
      await addEmployee.mutateAsync({
        id: crypto.randomUUID(),
        name: form.name.trim(),
        department: form.department,
        employeeIdCode: form.employeeIdCode.trim(),
      });
      toast.success(`${form.name} added.`);
      setAddOpen(false);
    } catch {
      toast.error("Failed to add employee.");
    }
  }

  async function handleEdit() {
    if (
      !editTarget ||
      !form.name.trim() ||
      !form.employeeIdCode.trim() ||
      !form.department
    ) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      await updateEmployee.mutateAsync({
        id: editTarget.id,
        name: form.name.trim(),
        department: form.department,
        employeeIdCode: form.employeeIdCode.trim(),
      });
      toast.success(`${form.name} updated.`);
      setEditTarget(null);
    } catch {
      toast.error("Failed to update employee.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEmployee.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.name} removed.`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete employee.");
    }
  }

  return (
    <div data-ocid="manage-employees.page">
      <PageHeader
        title="Manage Employees"
        breadcrumb={["Home", "Employees", "Manage"]}
      />

      <Card className="shadow-card border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-sm font-semibold">
              Employee Directory
            </CardTitle>
            <Button
              size="sm"
              onClick={openAdd}
              data-ocid="manage-employees.open_modal_button"
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> Add Employee
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or department..."
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-ocid="manage-employees.search_input"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="p-4 space-y-2"
              data-ocid="manage-employees.loading_state"
            >
              {["s1", "s2", "s3", "s4", "s5"].map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12"
              data-ocid="manage-employees.empty_state"
            >
              <Users className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                No employees found
              </p>
            </div>
          ) : (
            <Table data-ocid="manage-employees.table">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Employee ID</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp, i) => (
                  <TableRow
                    key={emp.id}
                    data-ocid={`manage-employees.item.${i + 1}`}
                  >
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {emp.employeeIdCode}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {emp.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {emp.department}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7"
                          onClick={() => openEdit(emp)}
                          data-ocid={`manage-employees.edit_button.${i + 1}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(emp)}
                          data-ocid={`manage-employees.delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent data-ocid="manage-employees.dialog">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input
                placeholder="e.g. Jane Smith"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                data-ocid="manage-employees.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Employee ID</Label>
              <Input
                placeholder="e.g. EMP-001"
                value={form.employeeIdCode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, employeeIdCode: e.target.value }))
                }
                data-ocid="manage-employees.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <Select
                value={form.department}
                onValueChange={(v) => setForm((p) => ({ ...p, department: v }))}
              >
                <SelectTrigger data-ocid="manage-employees.select">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              data-ocid="manage-employees.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={addEmployee.isPending}
              data-ocid="manage-employees.confirm_button"
            >
              {addEmployee.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => {
          if (!o) setEditTarget(null);
        }}
      >
        <DialogContent data-ocid="manage-employees.dialog">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                data-ocid="manage-employees.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Employee ID</Label>
              <Input
                value={form.employeeIdCode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, employeeIdCode: e.target.value }))
                }
                data-ocid="manage-employees.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <Select
                value={form.department}
                onValueChange={(v) => setForm((p) => ({ ...p, department: v }))}
              >
                <SelectTrigger data-ocid="manage-employees.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              data-ocid="manage-employees.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={updateEmployee.isPending}
              data-ocid="manage-employees.save_button"
            >
              {updateEmployee.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <DialogContent data-ocid="manage-employees.dialog">
          <DialogHeader>
            <DialogTitle>Remove Employee</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-ocid="manage-employees.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteEmployee.isPending}
              data-ocid="manage-employees.confirm_button"
            >
              {deleteEmployee.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
