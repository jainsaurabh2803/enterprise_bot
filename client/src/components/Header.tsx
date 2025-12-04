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
import { Badge } from "@/components/ui/badge";
import { Database, Settings, LogOut, User, Moon, Sun, PanelRightOpen, PanelRightClose, Table } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface SnowflakeSession {
  credentials: {
    account: string;
    username: string;
    warehouse: string;
    database: string;
    schema: string;
    role?: string;
  };
  connected: boolean;
}

interface HeaderProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  workflowPanelOpen: boolean;
  onToggleWorkflowPanel: () => void;
  selectedTables?: string[];
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
  selectedTables = [],
}: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [, setLocation] = useLocation();

  const { data: sessionData } = useQuery<{
    connected: boolean;
    session: SnowflakeSession | null;
  }>({
    queryKey: ["/api/snowflake/session"],
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleDisconnect = async () => {
    await fetch("/api/snowflake/disconnect", { method: "POST" });
    setLocation("/");
  };

  const handleChangeTables = () => {
    setLocation("/tables");
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

        {sessionData?.connected && sessionData.session && (
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
            <Badge variant="outline" className="gap-1">
              <Database className="h-3 w-3" />
              {sessionData.session.credentials.database}.{sessionData.session.credentials.schema}
            </Badge>
            {selectedTables.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 h-7" 
                onClick={handleChangeTables}
                data-testid="button-change-tables"
              >
                <Table className="h-3 w-3" />
                {selectedTables.length} table(s)
              </Button>
            )}
          </div>
        )}
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
            <DropdownMenuItem onClick={handleDisconnect} data-testid="menu-logout">
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
