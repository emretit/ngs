
import Proposals from "@/pages/Proposals";
import NewProposalCreate from "@/pages/NewProposalCreate";
import ProposalEdit from "@/pages/ProposalEdit";
import { RouteConfig } from "./types";

// Define proposal routes
export const proposalRoutes: RouteConfig[] = [
  { path: "/proposals", component: Proposals, protected: true },
  { path: "/proposals/create", component: NewProposalCreate, protected: true },
  { path: "/proposal/create", component: NewProposalCreate, protected: true },
  { path: "/proposal/:id", component: ProposalEdit, protected: true },
  { path: "/proposal/:id/edit", component: ProposalEdit, protected: true },
];
