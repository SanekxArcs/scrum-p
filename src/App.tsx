import { useState, useEffect } from 'react';
import { supabase, type Participant, type Vote, type RoomState, type Role } from './lib/supabase';
import { JoinRoom } from './components/JoinRoom';
import { PokerRoom } from './components/PokerRoom';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

function App() {
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  useEffect(() => {
    loadRoomState();
    loadParticipants();
    loadVotes();

    const participantsChannel = supabase
      .channel('participants-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => {
        loadParticipants();
      })
      .subscribe();

    const votesChannel = supabase
      .channel('votes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        loadVotes();
      })
      .subscribe();

    const roomStateChannel = supabase
      .channel('room-state-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_state' }, () => {
        loadRoomState();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(roomStateChannel);
    };
  }, []);

  const loadRoomState = async () => {
    const { data, error } = await supabase
      .from('room_state')
      .select('*')
      .maybeSingle();

    if (error) {
      toast.error('Failed to load room state');
      return;
    }

    setRoomState(data);
  };

  const loadParticipants = async () => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('is_online', true)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load participants');
      return;
    }

    setParticipants(data || []);
  };

  const loadVotes = async () => {
    if (!roomState) return;

    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('round_number', roomState.current_round);

    if (error) {
      toast.error('Failed to load votes');
      return;
    }

    setVotes(data || []);
  };

  useEffect(() => {
    if (roomState) {
      loadVotes();
    }
  }, [roomState?.current_round]);

  const handleJoin = async (name: string, role: Role) => {
    const { data, error } = await supabase
      .from('participants')
      .insert({ name, role, is_online: true })
      .select()
      .single();

    if (error) {
      toast.error('Failed to join room');
      return;
    }

    setCurrentUser(data);
    toast.success('Joined the room');
  };

  const handleLeave = async () => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('participants')
      .update({ is_online: false })
      .eq('id', currentUser.id);

    if (error) {
      toast.error('Failed to leave room');
      return;
    }

    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <>
        <JoinRoom onJoin={handleJoin} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <PokerRoom
        currentUser={currentUser}
        participants={participants}
        votes={votes}
        roomState={roomState}
        onLeave={handleLeave}
      />
      <Toaster />
    </>
  );
}

export default App;
