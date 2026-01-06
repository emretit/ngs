import { AIRole, getRoleQuickActions } from '@/services/aiPersonalityService';
import { cn } from '@/lib/utils';

interface RoleBasedPromptsProps {
  role: AIRole;
  onPromptClick: (prompt: string) => void;
  maxPrompts?: number;
  className?: string;
}

export function RoleBasedPrompts({
  role,
  onPromptClick,
  maxPrompts = 3,
  className
}: RoleBasedPromptsProps) {
  const quickActions = getRoleQuickActions(role).slice(0, maxPrompts);

  if (quickActions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {quickActions.map((prompt, index) => (
        <button
          key={index}
          onClick={() => onPromptClick(prompt)}
          className="w-full p-2 text-xs text-left rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-blue-50 transition-all group"
        >
          <span className="group-hover:text-violet-700 transition-colors">
            {prompt}
          </span>
        </button>
      ))}
    </div>
  );
}
