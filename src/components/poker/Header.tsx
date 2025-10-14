import { type Participant, type Room, supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { LogOut, Users, UserX, Link as LinkIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface HeaderProps {
  currentUser: Participant;
  room: Room;
  participants: Participant[];
  onLeave: () => void;
}

export function Header({ currentUser, room, participants, onLeave }: HeaderProps) {
  const roleColors = {
    'front-end': 'bg-blue-100 text-blue-800',
    'back-end': 'bg-green-100 text-green-800',
    'QA': 'bg-orange-100 text-orange-800',
    'PM': 'bg-purple-100 text-purple-800',
  };

  const isPM = currentUser.role === 'PM';

  const handleKickUser = async (participantId: string) => {
    const { error } = await supabase
      .from('participants')
      .update({ is_online: false })
      .eq('id', participantId);

    if (error) {
      toast.error('Failed to remove user');
      return;
    }

    toast.success('User removed from room');
  };

  const handleCopyRoomLink = () => {
    const url = `${window.location.origin}?room=${room.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Room link copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const otherParticipants = participants.filter((p) => p.id !== currentUser.id);

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{room.name}</h1>
              <p className="text-sm text-slate-600">
                {currentUser.name} <span className="text-slate-400">•</span>{' '}
                <Badge variant="secondary" className={roleColors[currentUser.role]}>
                  {currentUser.role}
                </Badge>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCopyRoomLink} size="sm">
              <LinkIcon className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            {isPM && otherParticipants.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <UserX className="w-4 h-4 mr-2" />
                    Manage Users
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Remove User</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {otherParticipants.map((participant) => (
                    <DropdownMenuItem
                      key={participant.id}
                      onClick={() => handleKickUser(participant.id)}
                      className="text-red-600"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      {participant.name} ({participant.role})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="outline" onClick={onLeave}>
              <LogOut className="w-4 h-4 mr-2" />
              Leave
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
