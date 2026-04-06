import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, BookOpen } from 'lucide-react';

const Subjects = () => {
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string }[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    const { data } = await supabase.from('subjects').select('*').order('name');
    setSubjects(data || []);
  };

  useEffect(() => { fetch(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;
    setLoading(true);
    const { error } = await supabase.from('subjects').insert({ name, code: code.toUpperCase() });
    if (error) toast.error(error.message);
    else {
      toast.success('Subject added');
      setName(''); setCode('');
      fetch();
    }
    setLoading(false);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Subject removed'); fetch(); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
          <p className="text-muted-foreground">Manage school subjects</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Add Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={add} className="flex gap-3">
              <Input placeholder="Subject Name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
              <Input placeholder="Code (e.g. MATH101)" value={code} onChange={(e) => setCode(e.target.value)} className="w-40" />
              <Button type="submit" disabled={loading}>
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No subjects yet.</TableCell>
                  </TableRow>
                ) : (
                  subjects.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell><span className="bg-muted px-2 py-1 rounded text-xs font-mono">{s.code}</span></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Subjects;
