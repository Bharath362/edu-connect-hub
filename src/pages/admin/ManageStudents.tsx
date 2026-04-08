import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Users, Search, UserPlus, Trash2 } from 'lucide-react';

const ManageStudents = () => {
  const [students, setStudents] = useState<{ user_id: string; full_name: string; email: string }[]>([]);
  const [allUsers, setAllUsers] = useState<{ user_id: string; full_name: string; email: string }[]>([]);
  const [adminUserIds, setAdminUserIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'student');
    if (roles && roles.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', roles.map(r => r.user_id));
      setStudents(profiles || []);
    } else setStudents([]);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('user_id, full_name, email');
    setAllUsers(data || []);
  };

  const fetchAdmins = async () => {
    const { data } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    setAdminUserIds(new Set((data || []).map(r => r.user_id)));
  };

  useEffect(() => { fetchStudents(); fetchUsers(); fetchAdmins(); }, []);

  const assign = async (userId: string) => {
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'student' as any });
    if (error) toast.error(error.message);
    else { toast.success('Student role assigned'); fetchStudents(); }
  };

  const remove = async (userId: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'student' as any);
    if (error) toast.error(error.message);
    else { toast.success('Student role removed'); fetchStudents(); }
  };

  const studentIds = new Set(students.map(s => s.user_id));
  // Hide admins from student assignment list
  const nonStudents = allUsers.filter(u => 
    !studentIds.has(u.user_id) && 
    !adminUserIds.has(u.user_id) && 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Students</h1>
          <p className="text-muted-foreground">Assign or remove student roles</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Current Students</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead className="w-20">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No students yet.</TableCell></TableRow>
                ) : students.map(s => (
                  <TableRow key={s.user_id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => remove(s.user_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assign New Student</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead className="w-20">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {nonStudents.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No users found.</TableCell></TableRow>
                ) : nonStudents.map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => assign(u.user_id)}><UserPlus className="h-4 w-4 text-primary" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManageStudents;
