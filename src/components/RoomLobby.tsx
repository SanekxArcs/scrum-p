import { useState, useEffect } from 'react';
import { supabase, type Room } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Plus, Lock, Users, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

interface RoomLobbyProps {
  onSelectRoom: (room: Room, password?: string) => void;
}

export function RoomLobby({ onSelectRoom }: RoomLobbyProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    loadRooms();

    const roomsChannel = supabase
      .channel('rooms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        loadRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
    };
  }, []);

  const loadRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load rooms');
      return;
    }

    setRooms(data || []);
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error('Room name is required');
      return;
    }

    if (isPrivate && !newRoomPassword.trim()) {
      toast.error('Password is required for private rooms');
      return;
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name: newRoomName.trim(),
        password: isPrivate ? newRoomPassword : null,
        is_private: isPrivate,
        last_activity_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create room');
      return;
    }

    const { error: stateError } = await supabase
      .from('room_state')
      .insert({
        room_id: data.id,
        current_round: 1,
        is_revealed: false,
        fe_multiplier: 1.0,
        be_multiplier: 1.0,
        qa_multiplier: 1.0,
      });

    if (stateError) {
      toast.error('Failed to initialize room state');
      return;
    }

    toast.success('Room created successfully');
    setIsCreateDialogOpen(false);
    setNewRoomName('');
    setNewRoomPassword('');
    setIsPrivate(false);
    onSelectRoom(data, isPrivate ? newRoomPassword : undefined);
  };

  const handleJoinRoom = (room: Room) => {
    if (room.is_private) {
      setSelectedRoom(room);
    } else {
      onSelectRoom(room);
    }
  };

  const handleJoinPrivateRoom = () => {
    if (!selectedRoom) return;

    if (passwordInput !== selectedRoom.password) {
      toast.error('Incorrect password');
      return;
    }

    onSelectRoom(selectedRoom, passwordInput);
    setSelectedRoom(null);
    setPasswordInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">Scrum Poker Rooms</CardTitle>
            <CardDescription>Select a room to join or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                  <DialogDescription>
                    Set up a new estimation room for your team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                      id="room-name"
                      placeholder="My Team Room"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="private-room"
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                    />
                    <Label htmlFor="private-room">Private Room (Password Protected)</Label>
                  </div>
                  {isPrivate && (
                    <div className="space-y-2">
                      <Label htmlFor="room-password">Password</Label>
                      <Input
                        id="room-password"
                        type="password"
                        placeholder="Enter password"
                        value={newRoomPassword}
                        onChange={(e) => setNewRoomPassword(e.target.value)}
                      />
                    </div>
                  )}
                  <Button onClick={handleCreateRoom} className="w-full">
                    Create Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{room.name}</CardTitle>
                  {room.is_private && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Private
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleJoinRoom(room)}
                  className="w-full"
                  variant="outline"
                >
                  Join Room
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {rooms.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-slate-500">No rooms available. Create one to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
            <DialogDescription>
              This room is password protected. Enter the password to join.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter room password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinPrivateRoom();
                  }
                }}
              />
            </div>
            <Button onClick={handleJoinPrivateRoom} className="w-full">
              Join Room
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
