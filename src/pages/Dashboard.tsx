import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, ClipboardCheck, UserCog } from 'lucide-react';

const Dashboard = () => {
  const { role, user } = useAuth();
  const [stats, setStats] = useState({ teachers: 0, students: 0, subjects: 0, attendance: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (role === 'admin') {
        const [teachers, students, subjects, attendance] = await Promise.all([
          supabase.from('user_roles').select('id', { count: 'exact' }).eq('role', 'teacher'),
          supabase.from('user_roles').select('id', { count: 'exact' }).eq('role', 'student'),
          supabase.from('subjects').select('id', { count: 'exact' }),
          supabase.from('attendance').select('id', { count: 'exact' }).eq('date', new Date().toISOString().split('T')[0]),
        ]);
        setStats({
          teachers: teachers.count || 0,
          students: students.count || 0,
          subjects: subjects.count || 0,
          attendance: attendance.count || 0,
        });
      } else if (role === 'teacher') {
        const [subjects, attendance] = await Promise.all([
          supabase.from('teacher_subjects').select('id', { count: 'exact' }).eq('teacher_id', user!.id),
          supabase.from('attendance').select('id', { count: 'exact' }).eq('teacher_id', user!.id).eq('date', new Date().toISOString().split('T')[0]),
        ]);
        setStats(s => ({ ...s, subjects: subjects.count || 0, attendance: attendance.count || 0 }));
      } else if (role === 'student') {
        const [subjects, attendance] = await Promise.all([
          supabase.from('student_subjects').select('id', { count: 'exact' }).eq('student_id', user!.id),
          supabase.from('attendance').select('id', { count: 'exact' }).eq('student_id', user!.id).eq('status', 'present'),
        ]);
        setStats(s => ({ ...s, subjects: subjects.count || 0, attendance: attendance.count || 0 }));
      }
    };
    if (user && role) fetchStats();
  }, [role, user]);

  const adminCards = [
    { title: 'Teachers', value: stats.teachers, icon: UserCog, color: 'text-primary' },
    { title: 'Students', value: stats.students, icon: Users, color: 'text-accent' },
    { title: 'Subjects', value: stats.subjects, icon: BookOpen, color: 'text-warning' },
    { title: "Today's Records", value: stats.attendance, icon: ClipboardCheck, color: 'text-success' },
  ];

  const teacherCards = [
    { title: 'My Subjects', value: stats.subjects, icon: BookOpen, color: 'text-primary' },
    { title: "Today's Marked", value: stats.attendance, icon: ClipboardCheck, color: 'text-success' },
  ];

  const studentCards = [
    { title: 'Enrolled Subjects', value: stats.subjects, icon: BookOpen, color: 'text-primary' },
    { title: 'Present Days', value: stats.attendance, icon: ClipboardCheck, color: 'text-success' },
  ];

  const cards = role === 'admin' ? adminCards : role === 'teacher' ? teacherCards : studentCards;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-card-foreground">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
