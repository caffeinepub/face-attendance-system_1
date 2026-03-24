import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/sonner";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from "@tanstack/react-router";
import {
  Bell,
  Camera,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useIsCallerAdmin } from "./hooks/useQueries";
import AdminPanel from "./pages/AdminPanel";
import Dashboard from "./pages/Dashboard";
import ManageEmployees from "./pages/ManageEmployees";
import MarkAttendance from "./pages/MarkAttendance";
import RegisterFace from "./pages/RegisterFace";

// Route definitions
const rootRoute = createRootRoute({
  component: RootLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});
const markAttendanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mark-attendance",
  component: MarkAttendance,
});
const registerFaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register-face",
  component: RegisterFace,
});
const manageEmployeesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/manage-employees",
  component: ManageEmployees,
});
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPanel,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  markAttendanceRoute,
  registerFaceRoute,
  manageEmployeesRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const navItems = [
  { to: "/" as const, icon: LayoutDashboard, label: "Dashboard" },
  { to: "/mark-attendance" as const, icon: Camera, label: "Mark Attendance" },
  { to: "/register-face" as const, icon: UserPlus, label: "Register Face" },
  { to: "/manage-employees" as const, icon: Users, label: "Manage Employees" },
];

export function PageHeader({
  title,
  breadcrumb,
}: { title: string; breadcrumb: string[] }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <div className="flex items-center gap-1.5 mt-1">
        {breadcrumb.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
            <span
              className={
                i === breadcrumb.length - 1
                  ? "text-xs font-medium text-primary"
                  : "text-xs text-muted-foreground"
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Sidebar({
  collapsed,
  onToggle,
}: { collapsed: boolean; onToggle: () => void }) {
  const { data: isAdmin } = useIsCallerAdmin();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const items = isAdmin
    ? [
        ...navItems,
        { to: "/admin" as const, icon: Settings, label: "Admin Panel" },
      ]
    : navItems;

  return (
    <div
      className="sidebar-gradient fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300"
      style={{ width: collapsed ? "72px" : "248px" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Camera className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-base tracking-tight">
            FaceFlow AI
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="ml-auto text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          data-ocid="sidebar.toggle"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* User profile */}
      <div className="px-3 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-primary/20 text-white text-xs">
              AD
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                Admin User
              </p>
              <p className="text-sidebar-foreground/50 text-xs truncate">
                Administrator
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1" data-ocid="sidebar.panel">
        {items.map((item) => {
          const active =
            item.to === "/"
              ? currentPath === "/"
              : currentPath.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              data-ocid={`nav.${item.label.toLowerCase().replace(/\s+/g, "-")}.link`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                active
                  ? "bg-primary text-white"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-sidebar-foreground/30 text-xs">FaceFlow AI v1.0</p>
        </div>
      )}
    </div>
  );
}

function pageMeta(path: string): { title: string; breadcrumb: string[] } {
  if (path === "/")
    return { title: "Dashboard", breadcrumb: ["Home", "Dashboard"] };
  if (path.startsWith("/mark-attendance"))
    return {
      title: "Mark Attendance | Face Recognition",
      breadcrumb: ["Home", "Attendance", "Face Recognition"],
    };
  if (path.startsWith("/register-face"))
    return {
      title: "Register Face",
      breadcrumb: ["Home", "Employees", "Register Face"],
    };
  if (path.startsWith("/manage-employees"))
    return {
      title: "Manage Employees",
      breadcrumb: ["Home", "Employees", "Manage"],
    };
  if (path.startsWith("/admin"))
    return { title: "Admin Panel", breadcrumb: ["Home", "Admin", "Panel"] };
  return { title: "FaceFlow AI", breadcrumb: ["Home"] };
}

function RootLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const meta = pageMeta(currentPath);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft: collapsed ? "72px" : "248px" }}
      >
        {/* Top header */}
        <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
          <p className="text-sm font-medium text-muted-foreground">
            {meta.title}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative p-2 rounded-lg hover:bg-accent transition-colors"
              data-ocid="header.notifications.button"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full" />
            </button>
            <Avatar className="w-8 h-8 cursor-pointer">
              <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                AD
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
          <footer className="mt-12 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </footer>
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default function App() {
  return <RouterProvider router={router} />;
}
