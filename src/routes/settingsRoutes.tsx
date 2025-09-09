
import Settings from "@/pages/Settings";
import PdfTemplateEditor from "@/pages/templates/PdfTemplateEditor";
import { RouteConfig } from "./types";

// Define settings routes
export const settingsRoutes: RouteConfig[] = [
  { path: "/settings", component: Settings, protected: true },
  { path: "/pdf-templates/new", component: PdfTemplateEditor, protected: true },
  { path: "/pdf-templates/edit/:templateId", component: PdfTemplateEditor, protected: true },
];
