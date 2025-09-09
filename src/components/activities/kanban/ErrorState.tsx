
import React from "react";

interface ErrorStateProps {
  error: Error;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  return (
    <div className="flex items-center justify-center h-[500px]">
      <div className="text-red-500">Error loading tasks: {error.message}</div>
    </div>
  );
};

export default ErrorState;
