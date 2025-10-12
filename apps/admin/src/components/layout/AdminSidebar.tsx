'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  CheckSquare,
  Megaphone,
  DollarSign,
  Settings,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAdminSession } from '@/hooks/use-admin-session';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navigation: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: Home },
  { title: 'Households', href: '/households', icon: Users },
  { title: 'Approvals', href: '/approvals', icon: CheckSquare },
  { title: 'Announcements', href: '/announcements', icon: Megaphone },
  { title: 'Fees', href: '/fees', icon: DollarSign },
  { title: 'Monitoring', href: '/monitoring', icon: ShieldCheck },
  { title: 'Settings', href: '/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useAdminSession();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return 'A';
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo/Branding */}
      <div className="flex h-16 items-center border-b px-6">
        <Building2 className="mr-2 h-6 w-6 text-primary" />
        <div>
          <h1 className="text-lg font-semibold">Admin Portal</h1>
          <p className="text-xs text-muted-foreground">HOA Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.title}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge variant={isActive ? 'secondary' : 'default'} className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info footer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {session ? getInitials(session.profile.first_name, session.profile.last_name) : 'A'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {session ? `${session.profile.first_name} ${session.profile.last_name}` : 'Loading...'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {session?.profile.email || ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
