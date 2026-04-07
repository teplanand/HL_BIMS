import type { ReactNode } from "react";
import {
  DashboardOutlined as DashboardOutlinedIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Warehouse as WarehouseIcon,
  GridView as GridViewIcon,
  ViewModule as ViewModuleIcon,
  ViewStream as ViewStreamIcon,
  Inventory as InventoryIcon,
  EventNote as EventNoteIcon,
  PostAdd as PostAddIcon,
  ShoppingCart as ShoppingCartIcon,
  FactCheck as FactCheckIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Assessment as AssessmentIcon,
  Verified as VerifiedIcon,
  MonitorHeart as MonitorHeartIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import type { Navigation } from "@toolpad/core/AppProvider";

 import AdvancePaymentDashboard from "./pages/AdvanceVoucher/Dashboard";
import SupplierPage from "./pages/AdvanceVoucher/Supplier";
import POPage from "./pages/AdvanceVoucher/PO";
import EvidanceDashboard from "./pages/EvidanceCollection/Dashboard";
import EvidanceSupplierPage from "./pages/EvidanceCollection/Dashboard";
import EvidancePOPage from "./pages/EvidanceCollection/Dashboard";
import InventoryDashboard from "./pages/Warehouse/Dashboard";
import WarehouselistPage from "./pages/Warehouse/Warehouselist";
import ZonelistPage from "./pages/Warehouse/Zonelist";
import RacklistPage from "./pages/Warehouse/Racklist";
import PalletlistPage from "./pages/Warehouse/Palletlist";
import ItemlistPage from "./pages/Warehouse/Itemlist";
import OrderTrackingDashboard from "./pages/OrderTracking/index";
import OrderTrackingConfiguration from "./pages/OrderTracking/configurationlist";
import ExampleForm from "./pages/SamplePages/MuiForm";
import FormPostPage from "./pages/SamplePages/formpost";
import BarcodeDashboard from "./pages/Barcode/Dashboard";
import { OrderComplition } from "./pages/Barcode/Dashboard/components/ordercomplition";
import { Reports } from "./pages/Barcode/Dashboard/components/reports";
import { FinalInspection } from "./pages/Barcode/Dashboard/components/finalinspection";
import SalesOrders from "./pages/Barcode/Dashboard/components/salesorders";
import GearMonitoringDashboard from "./pages/GearMonitoring";

//test

export type NavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    module?: string;
    subItems?: {
      name: string;
      path: string;
      pro?: boolean;
      new?: boolean;
      module?: string;
    }[];
  }[];
  roles: string[];
  module?: string;
};

export type PageRouteConfig = {
  name: string;
  icon: ReactNode;
  path: string;
  roles: string[];
  element: ReactNode;
};

export type ModuleRouteConfig = {
  module: string;
  children: PageRouteConfig[];
};

export const moduleRoutes: ModuleRouteConfig[] = [
  {
    module: "advance-voucher",
    children: [
      {
        name: "Dashboard",
        icon: <DashboardOutlinedIcon />,
        roles: ["admin"],
        path: "/dashboard",
        element: <AdvancePaymentDashboard type="supplier" />,
      },
      {
        name: "Supplier",
        icon: <BusinessIcon />,
        roles: ["admin"],
        path: "/supplier",
        element: <SupplierPage />,
      },
      {
        name: "PO",
        icon: <ReceiptIcon />,
        roles: ["admin"],
        path: "/po",
        element: <POPage />,
      },
    ],
  },

  {
    module: "purchase-order",
    children: [
      {
        name: "PO Dashboard",
        icon: <DashboardOutlinedIcon />,
        roles: ["admin"],
        path: "/dashboard",
        element: <AdvancePaymentDashboard type="supplier" />,
      },
      {
        name: "PO Supplier",
        icon: <BusinessIcon />,
        roles: ["admin"],
        path: "/supplier",
        element: <SupplierPage />,
      },
      {
        name: "PO PO",
        icon: <ReceiptIcon />,
        roles: ["admin"],
        path: "/po",
        element: <POPage />,
      },
    ],
  },

  {
    module: "supplier-portal",
    children: [
      {
        name: "SP Dashboard",
        icon: <DashboardOutlinedIcon />,
        roles: ["admin"],
        path: "/dashboard",
        element: <AdvancePaymentDashboard type="supplier" />,
      },
      {
        name: "sp Supplier",
        icon: <BusinessIcon />,
        roles: ["admin"],
        path: "/supplier",
        element: <SupplierPage />,
      },
      {
        name: "sp PO",
        icon: <ReceiptIcon />,
        roles: ["admin"],
        path: "/po",
        element: <POPage />,
      },
    ],
  },

  {
    module: "Warehouse",
    children: [
      {
        name: "Dashboard",
        icon: <DashboardOutlinedIcon />,
        roles: ["admin"],
        path: "/dashboard",
        element: <InventoryDashboard />,
      },
      {
        name: "Warehouse",
        icon: <WarehouseIcon />,
        roles: ["admin"],
        path: "/warehouselist",
        element: <WarehouselistPage />,
      },
      {
        name: "Zones",
        icon: <GridViewIcon />,
        roles: ["admin"],
        path: "/zonelist",
        element: <ZonelistPage />,
      },
      {
        name: "Rack",
        icon: <ViewModuleIcon />,
        roles: ["admin"],
        path: "/racklist",
        element: <RacklistPage />,
      },
      {
        name: "Pallets",
        icon: <ViewStreamIcon />,
        roles: ["admin"],
        path: "/palletlist",
        element: <PalletlistPage />,
      },
      {
        name: "Items",
        icon: <InventoryIcon />,
        roles: ["admin"],
        path: "/itemlist",
        element: <ItemlistPage />,
      },
    ],
  },


  {
    module: "hr-management",
    children: [
      {
        name: "HR Dashboard",
        icon: <DashboardOutlinedIcon />,
        roles: ["admin"],
        path: "/dashboard",
        element: <AdvancePaymentDashboard type="supplier" />,
      },
      {
        name: "HR Supplier",
        icon: <BusinessIcon />,
        roles: ["admin"],
        path: "/supplier",
        element: <SupplierPage />,
      },
      {
        name: "HR PO",
        icon: <ReceiptIcon />,
        roles: ["admin"],
        path: "/po",
        element: <POPage />,
      },
    ],
  },

  {
    module: "order-tracking",
    children: [
      {
        name: "Dashboard",
        icon: <DashboardOutlinedIcon />,
        roles: ["admin"],
        path: "/dashboard",
        element: <OrderTrackingDashboard />,
      },
      {
        name: "Plan Configuration",
        icon: <EventNoteIcon />,
        roles: ["admin", "user"],
        path: "/itemplan",
        element: <OrderTrackingConfiguration />,
      },

      // {
      //   name: "Form POST",
      //   icon: <PostAddIcon />,
      //   roles: ["admin", "user"],
      //   path: "/formpost",
      //   element: <FormPostPage />,
      // },

      // {
      //   name: "Example Form",
      //   icon: <DashboardOutlinedIcon />,
      //   roles: ["admin", "user"],
      //   path: "/example",
      //   element: <MuiSampleForm />,
      // },
    ],
  },

  {
    module: "barcode",
    children: [
      {
        name: "Dashboard",
        icon: <DashboardOutlinedIcon />,
        roles: ["admin"],
        path: "/dashboard",
        element: <BarcodeDashboard />,
      },
      {
        name: "Sales Orders",
        icon: <ShoppingCartIcon />,
        roles: ["admin"],
        path: "/salesorders",
        element: <SalesOrders />,
      },
      {
        name: "Final Inspection",
        icon: <FactCheckIcon />,
        roles: ["admin"],
        path: "/finalinspection",
        element: <FinalInspection />,
      },
      {
        name: "Order Completion",
        icon: <AssignmentTurnedInIcon />,
        roles: ["admin"],
        path: "/ordercompletion",
        element: <OrderComplition />,
      },

      {
        name: "Reports",
        icon: <AssessmentIcon />,
        roles: ["admin"],
        path: "/po",
        element: <Reports />,
      },
    ],
  },

  {
    module: "evidance",
    children: [
      {
        name: "Dashboard",
        icon: <DashboardOutlinedIcon />,
        roles: ["admin"],
        path: "/dashboard",
        element: <EvidanceDashboard />,
      },
      {
        name: "Supplier",
        icon: <BusinessIcon />,
        roles: ["admin"],
        path: "/supplier",
        element: <EvidanceSupplierPage />,
      },
      {
        name: "PO",
        icon: <VerifiedIcon />,
        roles: ["admin"],
        path: "/po",
        element: <EvidancePOPage />,
      },
    ],
  },

  {
    module: "monitoring",
    children: [
      {
        name: "Dashboard",
        icon: <MonitorHeartIcon />,
        roles: ["admin"],
        path: "/dashboard",
        element: <GearMonitoringDashboard />,
      },
    ],
  },

  {
    module: "sample-pages",
    children: [
      {
        name: "Example Form",
        icon: <AssignmentIcon />,
        roles: ["admin", "user"],
        path: "/example",
        element: <ExampleForm />,
      },
      {
        name: "Form POST",
        icon: <PostAddIcon />,
        roles: ["admin", "user"],
        path: "/formpost",
        element: <FormPostPage />,
      },
    ],
  },
];

export const navItems: NavItem[] = moduleRoutes.flatMap((module) =>
  module.children.map((page) => ({
    name: page.name,
    icon: page.icon,
    path: `/${module.module}${page.path}`,
    roles: page.roles,
    module: module.module,
  })),
);

export const NAVIGATION: Navigation = navItems.map((item) => ({
  kind: "page" as const,
  title: item.name,
  segment: item.path?.replace("/", ""),
  icon: item.icon,
  children: item.subItems?.map((sub) => ({
    kind: "page" as const,
    title: sub.name,
    segment: sub.path.replace("/", ""),
    children: sub.subItems?.map((nested) => ({
      kind: "page" as const,
      title: nested.name,
      segment: nested.path.replace("/", ""),
    })),
  })),
}));
