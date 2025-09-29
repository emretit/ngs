
import Settings from "@/pages/Settings";
import UsersSettings from "@/pages/settings/UsersSettings";
import NilveraSettingsPage from "@/pages/settings/NilveraSettings";
import SystemSettingsPage from "@/pages/settings/SystemSettings";
import PdfTemplatesSettings from "@/pages/settings/PdfTemplatesSettings";
import PdfTemplateEditor from "@/pages/templates/PdfTemplateEditor";
import { RouteConfig } from "./types";

// Define settings routes
export const settingsRoutes: RouteConfig[] = [
  { path: "/settings", component: Settings, protected: true },
  { path: "/settings/users", component: UsersSettings, protected: true },
  { path: "/settings/nilvera", component: NilveraSettingsPage, protected: true },
  { path: "/settings/system", component: SystemSettingsPage, protected: true },
  { path: "/settings/pdf-templates", component: PdfTemplatesSettings, protected: true },
  { path: "/pdf-templates/new", component: PdfTemplateEditor, protected: true },
  { path: "/pdf-templates/edit/:templateId", component: PdfTemplateEditor, protected: true },
];
