import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, Mail } from 'lucide-react';

const AdminEmails = () => {
  const [emails, setEmails] = useState<{ id: string; email: string; created_at: string }[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchEmails = async () => {
    const { data } = await supabase.from('admin_emails').select('*').order('created_at', { ascending: false });
    setEmails(data || []);
  };

  useEffect(() => { fetchEmails(); }, []);

  const addEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setLoading(true);
    const { error } = await supabase.from('admin_emails').insert({ email: newEmail.toLowerCase() });
    if (error) toast.error(error.message);
    else {
      toast.success('Admin email added');
      setNewEmail('');
      fetchEmails();
    }
    setLoading(false);
  };

  const deleteEmail = async (id: string) => {
    const { error } = await supabase.from('admin_emails').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Email removed');
      fetchEmails();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Emails</h1>
          <p className="text-muted-foreground">Users signing up with these emails will automatically become admins.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Add Admin Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addEmail} className="flex gap-3">
              <Input
                type="email"
                placeholder="admin@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No admin emails yet. Add one above.
                    </TableCell>
                  </TableRow>
                ) : (
                  emails.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteEmail(item.id)}>
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

export default AdminEmails;
