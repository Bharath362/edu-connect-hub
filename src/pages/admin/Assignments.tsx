import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { UserCheck, Plus, Trash2 } from 'lucide-react';

type Profile = { user_id: string; full_name: string; email: string };
type Subject = { id: string; name: string; code: string };

const Assignments = () => {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<any[]>([]);

  const [selTeacher, setSelTeacher] = useState('');
  const [selStudent, setSelStudent] = useState('');
  const [selSubjectT, setSelSubjectT] = useState('');
  const [selSubjectS, setSelSubjectS] = useState('');

  const fetchAll = async () => {
    const [tRoles, sRoles, subj, ts, ss] = await Promise.all([
      supabase.from('user_roles').select('user_id').eq('role', 'teacher'),
      supabase.from('user_roles').select('user_id').eq('role', 'student'),
      supabase.from('subjects').select('*'),
      supabase.from('teacher_subjects').select('*'),
      supabase.from('student_subjects').select('*'),
    ]);

    setSubjects(subj.data || []);
    setTeacherSubjects(ts.data || []);
    setStudentSubjects(ss.data || []);

    if (tRoles.data?.length) {
      const { data } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', tRoles.data.map(r => r.user_id));
      setTeachers(data || []);
    }
    if (sRoles.data?.length) {
      const { data } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', sRoles.data.map(r => r.user_id));
      setStudents(data || []);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Real-time subscriptions
  useEffect(() => {
    const ch1 = supabase.channel('ts-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'teacher_subjects' }, () => fetchAll()).subscribe();
    const ch2 = supabase.channel('ss-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'student_subjects' }, () => fetchAll()).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, []);

  const assignTeacherSubject = async () => {
    if (!selTeacher || !selSubjectT) return;
    const { error } = await supabase.from('teacher_subjects').insert({ teacher_id: selTeacher, subject_id: selSubjectT });
    if (error) toast.error(error.message);
    else { toast.success('Teacher assigned to subject'); fetchAll(); }
  };

  const assignStudentSubject = async () => {
    if (!selStudent || !selSubjectS) return;
    const { error } = await supabase.from('student_subjects').insert({ student_id: selStudent, subject_id: selSubjectS });
    if (error) toast.error(error.message);
    else { toast.success('Student enrolled in subject'); fetchAll(); }
  };

  const removeTS = async (id: string) => {
    await supabase.from('teacher_subjects').delete().eq('id', id);
    toast.success('Removed'); fetchAll();
  };

  const removeSS = async (id: string) => {
    await supabase.from('student_subjects').delete().eq('id', id);
    toast.success('Removed'); fetchAll();
  };

  const getTeacherName = (id: string) => teachers.find(t => t.user_id === id)?.full_name || id;
  const getStudentName = (id: string) => students.find(s => s.user_id === id)?.full_name || id;
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
          <p className="text-muted-foreground">Assign teachers & students to subjects</p>
        </div>

        <Tabs defaultValue="teachers">
          <TabsList>
            <TabsTrigger value="teachers">Teacher → Subject</TabsTrigger>
            <TabsTrigger value="students">Student → Subject</TabsTrigger>
          </TabsList>

          <TabsContent value="teachers" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserCheck className="h-5 w-5" /> Assign Teacher to Subject</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Select value={selTeacher} onValueChange={setSelTeacher}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => <SelectItem key={t.user_id} value={t.user_id}>{t.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selSubjectT} onValueChange={setSelSubjectT}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={assignTeacherSubject}><Plus className="mr-2 h-4 w-4" /> Assign</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Teacher</TableHead><TableHead>Subject</TableHead><TableHead className="w-20">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {teacherSubjects.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No assignments yet.</TableCell></TableRow>
                    ) : teacherSubjects.map(ts => (
                      <TableRow key={ts.id}>
                        <TableCell className="font-medium">{getTeacherName(ts.teacher_id)}</TableCell>
                        <TableCell>{getSubjectName(ts.subject_id)}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeTS(ts.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserCheck className="h-5 w-5" /> Enroll Student in Subject</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Select value={selStudent} onValueChange={setSelStudent}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select Student" /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selSubjectS} onValueChange={setSelSubjectS}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={assignStudentSubject}><Plus className="mr-2 h-4 w-4" /> Enroll</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Subject</TableHead><TableHead className="w-20">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {studentSubjects.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No enrollments yet.</TableCell></TableRow>
                    ) : studentSubjects.map(ss => (
                      <TableRow key={ss.id}>
                        <TableCell className="font-medium">{getStudentName(ss.student_id)}</TableCell>
                        <TableCell>{getSubjectName(ss.subject_id)}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeSS(ss.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Assignments;
