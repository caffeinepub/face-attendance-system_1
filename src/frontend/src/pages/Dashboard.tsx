import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { PageHeader } from "../App";
import {
  useGetAllEmployees,
  useGetAttendanceByDate,
  useGetAttendanceStats,
} from "../hooks/useQueries";

const today = new Date().toISOString().split("T")[0];

function StatusChip({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "present")
    return (
      <span className="chip-success text-xs font-semibold px-2.5 py-1 rounded-full">
        {status}
      </span>
    );
  if (s === "absent")
    return (
      <span className="chip-absent text-xs font-semibold px-2.5 py-1 rounded-full">
        {status}
      </span>
    );
  return (
    <span className="chip-late text-xs font-semibold px-2.5 py-1 rounded-full">
      {status}
    </span>
  );
}

function KPICard({
  title,
  value,
  icon: Icon,
  change,
  positive,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  change: string;
  positive: boolean;
  loading?: boolean;
}) {
  return (
    <Card className="shadow-card border-0">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-9 w-20 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground">{value}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3">
          {positive ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          )}
          <span
            className={`text-xs font-semibold ${positive ? "text-green-600" : "text-red-500"}`}
          >
            {change}
          </span>
          <span className="text-xs text-muted-foreground">vs yesterday</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: employees, isLoading: loadingEmp } = useGetAllEmployees();
  const { data: todayAttendance, isLoading: loadingAtt } =
    useGetAttendanceByDate(today);
  const { data: stats, isLoading: loadingStats } = useGetAttendanceStats(today);

  const present = Number(stats?.present ?? 0);
  const absent = Number(stats?.absent ?? 0);
  const total = Number(stats?.total ?? employees?.length ?? 0);

  const recentRecords = useMemo(() => {
    if (!todayAttendance) return [];
    return [...todayAttendance].sort(
      (a, b) => Number(b.timestamp) - Number(a.timestamp),
    );
  }, [todayAttendance]);

  return (
    <div data-ocid="dashboard.page">
      <PageHeader title="Dashboard" breadcrumb={["Home", "Dashboard"]} />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            title: "Today's Presence",
            value: String(present),
            icon: UserCheck,
            change: "+12%",
            positive: true,
          },
          {
            title: "Absentees",
            value: String(absent),
            icon: UserX,
            change: "-5%",
            positive: false,
          },
          {
            title: "Total Employees",
            value: String(total),
            icon: Users,
            change: "+2",
            positive: true,
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <KPICard {...kpi} loading={loadingStats || loadingEmp} />
          </motion.div>
        ))}
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Attendance rate visual */}
        <Card className="shadow-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Attendance Rate Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative flex items-center justify-center py-6">
              <div
                className="w-36 h-36 rounded-full"
                style={{
                  background: `conic-gradient(#2563EB ${total > 0 ? (present / total) * 360 : 0}deg, #E5E7EB 0deg)`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {total > 0 ? Math.round((present / total) * 100) : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">present</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">
                  Present ({present})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <span className="text-xs text-muted-foreground">
                  Absent ({absent})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's log */}
        <Card className="shadow-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Today's Attendance Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAtt ? (
              <div
                className="p-4 space-y-2"
                data-ocid="dashboard.loading_state"
              >
                {["s1", "s2", "s3", "s4"].map((k) => (
                  <Skeleton key={k} className="h-8 w-full" />
                ))}
              </div>
            ) : recentRecords.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-10 text-center"
                data-ocid="dashboard.empty_state"
              >
                <UserCheck className="w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No attendance records today
                </p>
              </div>
            ) : (
              <div className="overflow-auto max-h-64">
                <Table data-ocid="dashboard.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Employee</TableHead>
                      <TableHead className="text-xs">Dept</TableHead>
                      <TableHead className="text-xs">Time In</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRecords.slice(0, 8).map((r, i) => (
                      <TableRow
                        key={r.id}
                        data-ocid={`dashboard.item.${i + 1}`}
                      >
                        <TableCell className="text-xs font-medium">
                          {r.employeeName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.department}
                        </TableCell>
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
      </div>

      {/* Recent records */}
      <Card className="shadow-card border-0" data-ocid="dashboard.section">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Recent Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingAtt ? (
            <div className="p-4 space-y-2">
              {["s1", "s2", "s3", "s4", "s5"].map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : recentRecords.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12"
              data-ocid="dashboard.records.empty_state"
            >
              <Users className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                No records found for today
              </p>
            </div>
          ) : (
            <Table>
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
                {recentRecords.map((r, i) => (
                  <TableRow
                    key={r.id}
                    data-ocid={`dashboard.records.item.${i + 1}`}
                  >
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
