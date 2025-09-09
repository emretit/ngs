
export const getStatusColor = (status: string) => {
  const colors = {
    new: "bg-blue-100 text-blue-700",
    negotiation: "bg-yellow-100 text-yellow-700",
    follow_up: "bg-purple-100 text-purple-700",
    won: "bg-green-100 text-green-700",
    lost: "bg-red-100 text-red-700",
  };
  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700";
};

export const getPriorityColor = (priority: string) => {
  const colors = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };
  return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-700";
};

export const getTaskStatusColor = (status: string) => {
  const colors = {
    todo: "bg-gray-100 text-gray-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    postponed: "bg-yellow-100 text-yellow-700",
  };
  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700";
};

export const getOpportunityStatusColor = (status: string) => {
  const colors = {
    new: "bg-blue-100 text-blue-800",
    first_contact: "bg-purple-100 text-purple-800",
    site_visit: "bg-yellow-100 text-yellow-800",
    preparing_proposal: "bg-orange-100 text-orange-800",
    proposal_sent: "bg-indigo-100 text-indigo-800",
    accepted: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800"
  };
  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700";
};
