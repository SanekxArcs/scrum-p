import { useState } from 'react';
import { type Role } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Users } from 'lucide-react';

interface JoinRoomProps {
  onJoin: (name: string, role: Role) => void;
}

export function JoinRoom({ onJoin }: JoinRoomProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('front-end');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim(), role);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-2">
            <Users className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Scrum Poker</CardTitle>
          <CardDescription>Join your team's estimation session</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Your Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="front-end">Front-End Developer</SelectItem>
                  <SelectItem value="back-end">Back-End Developer</SelectItem>
                  <SelectItem value="QA">QA Engineer</SelectItem>
                  <SelectItem value="PM">Product Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" size="lg">
              Join Room
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
