import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AlertBannerProps {
  message: string;
  title: string;
  type: "critical" | "warning" | "info";
}

export function AlertBanner({ message, title, type }: AlertBannerProps) {
  const getAlertStyles = () => {
    switch (type) {
      case "critical":
        return "bg-danger-50 border-danger-500 dark:bg-opacity-10 text-danger-600 dark:text-danger-500 animate-pulse-slow";
      case "warning":
        return "bg-warning-50 border-warning-500 dark:bg-opacity-10 text-warning-600 dark:text-warning-500";
      case "info":
        return "bg-primary-50 border-primary-500 dark:bg-opacity-10 text-primary-600 dark:text-primary-500";
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case "critical":
        return "warning";
      case "warning":
        return "warning";
      case "info":
        return "info";
    }
  };
  
  return (
    <Alert className={`mb-8 border-l-4 p-4 rounded-md shadow-sm ${getAlertStyles()}`}>
      <div className="flex items-center">
        <span className={`material-icons mr-2`}>{getIcon()}</span>
        <div>
          <AlertTitle className="font-medium">{title}</AlertTitle>
          <AlertDescription className="text-sm text-gray-600 dark:text-gray-300">
            {message}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
