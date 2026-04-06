import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap, LayoutDashboard, Users, BookOpen,
  ClipboardCheck, Mail, LogOut, UserCog, UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const AppSidebar = () => {
  const { role, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const adminLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/emails', label: 'Admin Emails', icon: Mail },
    { href: '/admin/subjects', label: 'Subjects', icon: BookOpen },
    { href: '/admin/teachers', label: 'Teachers', icon: UserCog },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/assign', label: 'Assignments', icon: UserCheck },
    { href: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  ];

  const teacherLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/attendance', label: 'Mark Attendance', icon: ClipboardCheck },
  ];

  const studentLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/attendance', label: 'My Attendance', icon: ClipboardCheck },
  ];

  const links = role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <div className="flex flex-col h-full w-64 bg-card border-r border-border">
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <div className="rounded-lg bg-primary p-2">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-semibold text-sm text-card-foreground">Attendance</h2>
          <p className="text-xs text-muted-foreground capitalize">{role || 'User'}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <button
            key={link.href}
            onClick={() => navigate(link.href)}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors',
              location.pathname === link.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <div className="px-3">
          <p className="text-sm font-medium text-card-foreground truncate">{profile?.full_name}</p>
          <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
        </div>
        <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default AppSidebar;
