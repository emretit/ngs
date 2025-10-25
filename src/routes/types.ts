
export interface RouteConfig {
  path: string;
  component: any; // Using any for component type to avoid excessive prop passing
  protected?: boolean;
  requiredModule?: string;
  isAdmin?: boolean;
}
