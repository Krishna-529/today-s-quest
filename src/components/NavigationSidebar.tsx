import { Menu, Home, Calendar, Archive, FolderKanban, Settings, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavigationSidebarProps {
  currentView: string;
  currentTab?: string;
  completionFilter?: "all" | "completed" | "incomplete";
  onViewChange: (view: string) => void;
  onTabChange?: (tab: string) => void;
  onCompletionFilterChange?: (filter: "all" | "completed" | "incomplete") => void;
  onArchive: () => void;
  onSignOut: () => void;
  isArchiving?: boolean;
  overdueCount?: number;
}

export const NavigationSidebar = ({
  currentView,
  currentTab = "tasks",
  completionFilter = "all",
  onViewChange,
  onTabChange,
  onCompletionFilterChange,
  onArchive,
  onSignOut,
  isArchiving = false,
  overdueCount = 0,
}: NavigationSidebarProps) => {
  const mainNavItems: NavItem[] = [
    { id: "today", label: "Today", icon: Home },
    { id: "tomorrow", label: "Tomorrow", icon: Calendar },
    { id: "upcoming", label: "Upcoming", icon: Calendar },
    { id: "all", label: "All Tasks", icon: FolderKanban },
  ];

  const secondaryNavItems: NavItem[] = [
    { id: "archived", label: "Archived Tasks", icon: Archive, badge: overdueCount },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>
            Organize your tasks with ease
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground mb-2 px-2">
              Views
            </p>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-secondary"
                  )}
                  onClick={() => onViewChange(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                      {item.badge}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>

          <Separator />

          {/* Secondary Navigation */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground mb-2 px-2">
              Archive
            </p>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-secondary"
                  )}
                  onClick={() => {
                    if (onTabChange) {
                      onTabChange(item.id);
                    }
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto bg-orange-500 text-white rounded-full px-2 py-0.5 text-xs">
                      {item.badge}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>

          <Separator />

          {/* Completion Filter */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground mb-2 px-2">
              Filter Tasks
            </p>
            <div className="grid grid-cols-3 gap-2 px-2">
              <Button
                size="sm"
                variant={completionFilter === "all" ? "default" : "outline"}
                onClick={() => onCompletionFilterChange?.("all")}
                className="text-xs"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={completionFilter === "incomplete" ? "default" : "outline"}
                onClick={() => onCompletionFilterChange?.("incomplete")}
                className="text-xs"
              >
                Active
              </Button>
              <Button
                size="sm"
                variant={completionFilter === "completed" ? "default" : "outline"}
                onClick={() => onCompletionFilterChange?.("completed")}
                className="text-xs"
              >
                Done
              </Button>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground mb-2 px-2">
              Actions
            </p>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={onArchive}
              disabled={isArchiving}
            >
              <Archive className="h-4 w-4" />
              <span>{isArchiving ? "Archiving..." : "Archive Past Due"}</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
