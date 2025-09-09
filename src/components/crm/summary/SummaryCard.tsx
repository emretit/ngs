
import { ReactNode } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SummaryCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  viewAllPath: string;
  createPath: string;
  iconBgColor: string;
  iconTextColor: string;
  children: ReactNode;
}

const SummaryCard = ({
  title,
  description,
  icon,
  viewAllPath,
  createPath,
  iconBgColor,
  iconTextColor,
  children
}: SummaryCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="w-full shadow-md border border-gray-200 h-full bg-white">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className={`${iconBgColor} p-2 rounded-full`}>
            <div className={`h-5 w-5 ${iconTextColor}`}>{icon}</div>
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {children}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-4">
        <Button 
          variant="outline" 
          className="w-full justify-center"
          onClick={() => navigate(viewAllPath)}
        >
          Tüm {title}i Görüntüle
        </Button>
        <Button
          className="w-full justify-center"
          onClick={() => navigate(createPath)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
          Yeni {title.slice(0, -1)}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SummaryCard;
