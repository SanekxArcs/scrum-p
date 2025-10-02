import { type Participant } from '../../lib/supabase';
import { Button } from '../ui/button';
import { LogOut, Users } from 'lucide-react';
import { Badge } from '../ui/badge';

interface HeaderProps {
  currentUser: Participant;
  onLeave: () => void;
}

export function Header({ currentUser, onLeave }: HeaderProps) {
  const roleColors = {
    'front-end': 'bg-blue-100 text-blue-800',
    'back-end': 'bg-green-100 text-green-800',
    'QA': 'bg-orange-100 text-orange-800',
    'PM': 'bg-purple-100 text-purple-800',
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Scrum Poker</h1>
              <p className="text-sm text-slate-600">
                {currentUser.name} <span className="text-slate-400">•</span>{' '}
                <Badge variant="secondary" className={roleColors[currentUser.role]}>
                  {currentUser.role}
                </Badge>
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onLeave}>
            <LogOut className="w-4 h-4 mr-2" />
            Leave
          </Button>
        </div>
      </div>
    </header>
  );
}
