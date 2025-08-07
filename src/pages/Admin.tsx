import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Users, Settings, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EnhancedBatchManagement from '@/components/EnhancedBatchManagement';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}


interface Batch {
  id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

const Admin = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (userRole && userRole !== 'admin') {
      navigate('/');
      toast({
        title: 'Access Denied',
        description: 'You do not have admin privileges.',
        variant: 'destructive',
      });
      return;
    }
    if (userRole === 'admin') {
      fetchData();
    }
  }, [user, userRole, navigate]);

  const fetchData = async () => {
    try {
      // Fetch users with their roles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          created_at,
          user_roles (role)
        `);

      if (usersError) throw usersError;

      // Get user emails from auth metadata (this would need to be done via an edge function in production)
      const formattedUsers = usersData?.map(user => ({
        id: user.user_id,
        email: 'user@example.com', // In production, fetch from edge function
        full_name: user.full_name || 'N/A',
        role: (user.user_roles as any)?.[0]?.role || 'student',
        created_at: user.created_at,
      })) || [];

      setUsers(formattedUsers);

      // Fetch batches
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (batchesError) throw batchesError;
      setBatches(batchesData || []);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground">Only administrators can access this panel.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: users.length,
      icon: Users,
      description: 'Registered users',
    },
    {
      title: 'Batches',
      value: batches.length,
      icon: GraduationCap,
      description: 'Active batches',
    },
  ];

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 lg:p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage users and batches
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-8">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="batches" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="batches" className="text-xs sm:text-sm">Batches</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="batches" className="space-y-4">
            <EnhancedBatchManagement />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage registered users and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{user.full_name}</h4>
                        <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
          >
            Back to Main App
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Admin;