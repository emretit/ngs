import React from "react";
import { RouteConfig } from "./types";

// Lazy load all proposal pages
const Proposals = React.lazy(() => import("@/pages/Proposals"));
const NewProposalCreate = React.lazy(() => import("@/pages/NewProposalCreate"));
const ProposalEdit = React.lazy(() => import("@/pages/ProposalEdit"));

// Define proposal routes
export const proposalRoutes: RouteConfig[] = [
  { path: "/proposals", component: Proposals, protected: true },
  { path: "/proposals/create", component: NewProposalCreate, protected: true },
  { path: "/proposal/create", component: NewProposalCreate, protected: true },
  { path: "/proposal/:id", component: ProposalEdit, protected: true },
  { path: "/proposal/:id/edit", component: ProposalEdit, protected: true },
];
