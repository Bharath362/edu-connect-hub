import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, Mail, Shield, ArrowRightLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const AdminEmails = () => {
  const [emails, setEmails] = useState<{ id: string; email: string; created_at: string }[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [transferEmail, setTransferEmail] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);

  const fetchEmails = async () => {
    const { data } = await supabase.from('admin_emails').select('*').order('created_at', { ascending: false });
    setEmails(data || []);
  };

  const fetchPrimaryAdmin = async () => {
    const { data } = await supabase.from('primary_admin' as any).select('email').limit(1).maybeSingle();
    setPrimaryEmail((data as any)?.email || '');
  };

  useEffect(() => { fetchEmails(); fetchPrimaryAdmin(); }, []);

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

  const deleteEmail = async (id: string, email: string) => {
    if (email === primaryEmail) {
      toast.error('Cannot delete primary admin email');
      return;
    }
    const { error } = await supabase.from('admin_emails').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Email removed');
      fetchEmails();
    }
  };

  const handleTransfer = async () => {
    if (!transferEmail) return;
    setLoading(true);
    const { error } = await supabase.rpc('transfer_primary_admin', { new_email: transferEmail.toLowerCase() });
    if (error) toast.error(error.message);
    else {
      toast.success('Primary admin transferred');
      setTransferEmail('');
      setTransferOpen(false);
      fetchPrimaryAdmin();
      fetchEmails();
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Emails</h1>
          <p className="text-muted-foreground">Users signing up with these emails will automatically become admins.</p>
        </div>

        {primaryEmail && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Primary Admin</p>
                  <p className="text-sm text-muted-foreground">{primaryEmail}</p>
                </div>
              </div>
              <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Transfer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transfer Primary Admin</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Enter the email of the new primary admin. This action cannot be undone by you.</p>
                    <Input
                      type="email"
                      placeholder="new-admin@example.com"
                      value={transferEmail}
                      onChange={(e) => setTransferEmail(e.target.value)}
                    />
                    <Button onClick={handleTransfer} disabled={loading} className="w-full">
                      {loading ? 'Transferring...' : 'Transfer Primary Admin'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Add Admin Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addEmail} className="flex gap-3">
              <Input type="email" placeholder="admin@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="flex-1" />
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
                      <TableCell className="font-medium">
                        {item.email}
                        {item.email === primaryEmail && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Primary</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {item.email === primaryEmail ? (
                          <Button variant="ghost" size="icon" disabled>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => deleteEmail(item.id, item.email)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
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
