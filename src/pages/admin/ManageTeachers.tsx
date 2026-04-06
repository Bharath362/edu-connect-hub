import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { UserCog, Search, UserPlus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState<{ user_id: string; full_name: string; email: string }[]>([]);
  const [allUsers, setAllUsers] = useState<{ user_id: string; full_name: string; email: string }[]>([]);
  const [search, setSearch] = useState('');

  const fetchTeachers = async () => {
    const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'teacher');
    if (roles && roles.length > 0) {
      const ids = roles.map(r => r.user_id);
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', ids);
      setTeachers(profiles || []);
    } else {
      setTeachers([]);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('user_id, full_name, email');
    setAllUsers(data || []);
  };

  useEffect(() => { fetchTeachers(); fetchUsers(); }, []);

  const assignTeacher = async (userId: string) => {
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'teacher' as any });
    if (error) toast.error(error.message);
    else { toast.success('Teacher role assigned'); fetchTeachers(); }
  };

  const removeTeacher = async (userId: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'teacher' as any);
    if (error) toast.error(error.message);
    else { toast.success('Teacher role removed'); fetchTeachers(); }
  };

  const teacherIds = new Set(teachers.map(t => t.user_id));
  const nonTeachers = allUsers.filter(u => !teacherIds.has(u.user_id) && u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Teachers</h1>
          <p className="text-muted-foreground">Assign or remove teacher roles</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCog className="h-5 w-5" /> Current Teachers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No teachers assigned yet.</TableCell></TableRow>
                ) : teachers.map(t => (
                  <TableRow key={t.user_id}>
                    <TableCell className="font-medium">{t.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.email}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeTeacher(t.user_id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assign New Teacher</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonTeachers.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No users found.</TableCell></TableRow>
                ) : nonTeachers.map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => assignTeacher(u.user_id)}>
                        <UserPlus className="h-4 w-4 text-primary" />
                      </Button>
                    </TableCell>
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

export default ManageTeachers;
