'use client';

/**
 * Platform Dashboard Layout (T058)
 *
 * Main layout for authenticated superadmin users with:
 * - Sidebar navigation (tenants, analytics, settings)
 * - Top header with user menu
 * - Responsive design with mobile drawer
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSuperadminSession, useDisplayName, useUserInitials } from '@/hooks/use-superadmin-session';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Building2,
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  User,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Tenants',
    href: '/tenants',
    icon: Building2,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Superadmins',
    href: '/superadmins',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn('flex flex-col gap-1', className)}>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
            {item.badge && (
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {item.badge}
              </span>
            )}
            {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut, isLoading } = useSuperadminSession();
  const displayName = useDisplayName();
  const initials = useUserInitials();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg">VillageTech</span>
          </Link>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <NavLinks />
        </div>

        <div className="border-t p-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted p-3 text-sm">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">Superadmin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
          {/* Mobile Menu Button */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg">VillageTech</span>
                </Link>
              </div>
              <div className="p-4">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold lg:text-xl">Platform</h1>
              <p className="text-sm text-muted-foreground">Manage residential communities</p>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.position || 'Superadmin'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
