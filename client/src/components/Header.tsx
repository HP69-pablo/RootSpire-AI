import { useTheme } from "@/lib/useTheme";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="material-icons text-primary-500">eco</span>
          <h1 className="text-xl font-semibold">Smart Plant Monitor</h1>
        </div>
        
        <div className="flex items-center">
          <span className="material-icons text-gray-500 dark:text-gray-400 mr-2 text-sm">light_mode</span>
          <div className="relative inline-block w-12 mr-2 align-middle select-none">
            <input 
              type="checkbox" 
              id="theme-toggle" 
              checked={theme === 'dark'}
              onChange={toggleTheme}
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
            />
            <label 
              htmlFor="theme-toggle" 
              className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer transition-colors duration-200 ease-in-out"
            ></label>
          </div>
          <span className="material-icons text-gray-500 dark:text-gray-400 text-sm">dark_mode</span>
        </div>
      </div>
    </header>
  );
}
