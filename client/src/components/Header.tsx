import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database, Settings, LogOut, User, Moon, Sun, PanelRightOpen, PanelRightClose } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  workflowPanelOpen: boolean;
  onToggleWorkflowPanel: () => void;
}

const roles = [
  { value: "analyst", label: "ANALYST" },
  { value: "data_engineer", label: "DATA_ENGINEER" },
  { value: "admin", label: "ADMIN" },
];

export default function Header({
  currentRole,
  onRoleChange,
  workflowPanelOpen,
  onToggleWorkflowPanel,
}: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-background px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary p-1.5">
            <Database className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">MCP Analytics</h1>
            <p className="text-xs text-muted-foreground">Snowflake Intelligence</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Role:</span>
          <Select value={currentRole} onValueChange={onRoleChange}>
            <SelectTrigger className="h-8 w-[140px]" data-testid="select-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={toggleDarkMode}
          data-testid="button-theme-toggle"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleWorkflowPanel}
          data-testid="button-toggle-workflow"
        >
          {workflowPanelOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-user-menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  JD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>John Doe</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="menu-profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="menu-logout">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
