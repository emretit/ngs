import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Legacy LeaveSettings page - redirects to unified management
 * @deprecated Use /settings/unified-management?tab=leave-types instead
 */
const LeaveSettings = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/settings/unified-management?tab=leave-types", { replace: true });
  }, [navigate]);

  return null;
};

export default LeaveSettings;
