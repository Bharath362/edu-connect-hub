import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ClipboardCheck, Check, X, Clock } from 'lucide-react';

type StudentInfo = { user_id: string; full_name: string; email: string };
type SubjectInfo = { id: string; name: string; code: string };
type AttendanceRecord = { id: string; student_id: string; subject_id: string; date: string; status: string };

const Attendance = () => {
  const { role, user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch subjects for teacher
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user) return;
      if (role === 'teacher') {
        const { data: ts } = await supabase.from('teacher_subjects').select('subject_id').eq('teacher_id', user.id);
        if (ts?.length) {
          const { data } = await supabase.from('subjects').select('*').in('id', ts.map(t => t.subject_id));
          setSubjects(data || []);
        }
      } else if (role === 'admin') {
        const { data } = await supabase.from('subjects').select('*');
        setSubjects(data || []);
      } else if (role === 'student') {
        const { data: ss } = await supabase.from('student_subjects').select('subject_id').eq('student_id', user.id);
        if (ss?.length) {
          const { data } = await supabase.from('subjects').select('*').in('id', ss.map(s => s.subject_id));
          setSubjects(data || []);
        }
      }
    };
    fetchSubjects();
  }, [role, user]);

  // Fetch students for selected subject
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedSubject) return;
      const { data: ss } = await supabase.from('student_subjects').select('student_id').eq('subject_id', selectedSubject);
      if (ss?.length) {
        const { data } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', ss.map(s => s.student_id));
        setStudents(data || []);
      } else setStudents([]);
    };
    if (role !== 'student') fetchStudents();
  }, [selectedSubject, role]);

  // Fetch attendance records
  useEffect(() => {
    const fetchRecords = async () => {
      if (!selectedSubject) return;
      let query = supabase.from('attendance').select('*').eq('subject_id', selectedSubject).eq('date', selectedDate);
      if (role === 'student') query = query.eq('student_id', user!.id);
      const { data } = await query;
      setRecords(data || []);
    };
    fetchRecords();
  }, [selectedSubject, selectedDate, role, user]);

  // Real-time attendance updates
  useEffect(() => {
    const channel = supabase
      .channel('attendance-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, (payload) => {
        if (selectedSubject) {
          // Refetch
          let query = supabase.from('attendance').select('*').eq('subject_id', selectedSubject).eq('date', selectedDate);
          if (role === 'student') query = query.eq('student_id', user!.id);
          query.then(({ data }) => setRecords(data || []));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedSubject, selectedDate, role, user]);

  const markAttendance = async (studentId: string, status: string) => {
    if (!user || !selectedSubject) return;
    setLoading(true);
    const existing = records.find(r => r.student_id === studentId);
    if (existing) {
      const { error } = await supabase.from('attendance').update({ status }).eq('id', existing.id);
      if (error) toast.error(error.message);
      else toast.success('Attendance updated');
    } else {
      const { error } = await supabase.from('attendance').insert({
        student_id: studentId,
        subject_id: selectedSubject,
        teacher_id: user.id,
        date: selectedDate,
        status,
      });
      if (error) toast.error(error.message);
      else toast.success('Attendance marked');
    }
    setLoading(false);
  };

  const getStatus = (studentId: string) => records.find(r => r.student_id === studentId)?.status;

  const statusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="outline" className="text-muted-foreground">Not marked</Badge>;
    const variants: Record<string, { className: string; icon: any; label: string }> = {
      present: { className: 'bg-success text-success-foreground', icon: Check, label: 'Present' },
      absent: { className: 'bg-destructive text-destructive-foreground', icon: X, label: 'Absent' },
      late: { className: 'bg-warning text-warning-foreground', icon: Clock, label: 'Late' },
    };
    const v = variants[status];
    if (!v) return null;
    return <Badge className={v.className}><v.icon className="h-3 w-3 mr-1" />{v.label}</Badge>;
  };

  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {role === 'student' ? 'My Attendance' : 'Mark Attendance'}
          </h1>
          <p className="text-muted-foreground">
            {role === 'student' ? 'View your attendance records' : 'Mark and manage student attendance in real-time'}
          </p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-60"><SelectValue placeholder="Select Subject" /></SelectTrigger>
            <SelectContent>
              {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-48" />
        </div>

        {selectedSubject && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                {role === 'student' ? 'Attendance Records' : 'Student List'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {role === 'student' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No records for this date.</TableCell></TableRow>
                    ) : records.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      {isTeacherOrAdmin && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No students enrolled.</TableCell></TableRow>
                    ) : students.map(s => (
                      <TableRow key={s.user_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{s.full_name}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(getStatus(s.user_id))}</TableCell>
                        {isTeacherOrAdmin && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant={getStatus(s.user_id) === 'present' ? 'default' : 'outline'}
                                className={getStatus(s.user_id) === 'present' ? 'bg-success hover:bg-success/90' : ''}
                                onClick={() => markAttendance(s.user_id, 'present')} disabled={loading}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant={getStatus(s.user_id) === 'absent' ? 'default' : 'outline'}
                                className={getStatus(s.user_id) === 'absent' ? 'bg-destructive hover:bg-destructive/90' : ''}
                                onClick={() => markAttendance(s.user_id, 'absent')} disabled={loading}>
                                <X className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant={getStatus(s.user_id) === 'late' ? 'default' : 'outline'}
                                className={getStatus(s.user_id) === 'late' ? 'bg-warning hover:bg-warning/90' : ''}
                                onClick={() => markAttendance(s.user_id, 'late')} disabled={loading}>
                                <Clock className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
