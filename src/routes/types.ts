import { ComponentType, LazyExoticComponent } from "react";

export interface RouteConfig {
  path: string;
  component: ComponentType<any> | LazyExoticComponent<ComponentType<any>>;
  protected?: boolean;
  requiredModule?: string;
  isAdmin?: boolean;
}
