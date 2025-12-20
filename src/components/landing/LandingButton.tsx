import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

interface LandingButtonProps {
  variant?: "primary" | "secondary" | "outline";
  href?: string;
  to?: string;
  onClick?: () => void;
  children: ReactNode;
  showArrow?: boolean;
  className?: string;
}

const LandingButton = ({
  variant = "primary",
  href,
  to,
  onClick,
  children,
  showArrow = false,
  className = "",
}: LandingButtonProps) => {
  const baseStyles = {
    primary: "group relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-semibold overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]",
    secondary: "group relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-semibold overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]",
    outline: "flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/20 text-white text-sm font-medium hover:bg-white/10 hover:border-white/30 backdrop-blur-sm transition-all duration-300",
  };

  const hoverOverlay = variant === "primary" || variant === "secondary" 
    ? <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    : null;

  const content = (
    <>
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {showArrow && (
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        )}
      </span>
      {hoverOverlay}
    </>
  );

  const combinedClassName = `${baseStyles[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combinedClassName}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combinedClassName}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={combinedClassName}>
      {content}
    </button>
  );
};

export default LandingButton;

