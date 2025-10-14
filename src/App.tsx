import { useState, useEffect } from 'react';
import { supabase, type Participant, type Vote, type RoomState, type Role, type Room } from './lib/supabase';
import { RoomLobby } from './components/RoomLobby';
import { JoinRoom } from './components/JoinRoom';
import { PokerRoom } from './components/PokerRoom';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { generateSessionToken, saveSession, getSessionToken, getRoomId, clearSession } from './lib/session';

type AppState = 'lobby' | 'joining' | 'in-room';

function App() {
  const [appState, setAppState] = useState<AppState>('lobby');
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

  useEffect(() => {
    if (currentRoom) {
      loadRoomState();
      loadParticipants();
      loadVotes();

      const participantsChannel = supabase
        .channel('participants-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, (payload) => {
          if (payload.eventType === 'UPDATE' && currentUser) {
            const updated = payload.new as Participant;
            if (updated.id === currentUser.id && !updated.is_online) {
              toast.error('You have been removed from the room');
              handleLeave();
            }
          }
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

      const heartbeatInterval = setInterval(() => {
        updateLastSeen();
        updateRoomActivity();
      }, 30000);

      return () => {
        supabase.removeChannel(participantsChannel);
        supabase.removeChannel(votesChannel);
        supabase.removeChannel(roomStateChannel);
        clearInterval(heartbeatInterval);
      };
    }
  }, [currentRoom, currentUser]);

  const checkExistingSession = async () => {
    const sessionToken = getSessionToken();
    const roomId = getRoomId();

    if (!sessionToken || !roomId) {
      setAppState('lobby');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get('room');

    const targetRoomId = urlRoomId || roomId;

    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('room_id', targetRoomId)
      .eq('is_online', true)
      .maybeSingle();

    if (participantError || !participant) {
      clearSession();
      setAppState('lobby');
      return;
    }

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', targetRoomId)
      .maybeSingle();

    if (roomError || !room) {
      clearSession();
      setAppState('lobby');
      return;
    }

    setCurrentUser(participant);
    setCurrentRoom(room);
    setAppState('in-room');
    toast.success('Welcome back!');
  };

  const updateLastSeen = async () => {
    if (!currentUser) return;

    await supabase
      .from('participants')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', currentUser.id);
  };

  const updateRoomActivity = async () => {
    if (!currentRoom) return;

    await supabase
      .from('rooms')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', currentRoom.id);
  };

  const loadRoomState = async () => {
    if (!currentRoom) return;

    const { data, error } = await supabase
      .from('room_state')
      .select('*')
      .eq('room_id', currentRoom.id)
      .maybeSingle();

    if (error) {
      toast.error('Failed to load room state');
      return;
    }

    setRoomState(data);
  };

  const loadParticipants = async () => {
    if (!currentRoom) return;

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('room_id', currentRoom.id)
      .eq('is_online', true)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load participants');
      return;
    }

    setParticipants(data || []);
  };

  const loadVotes = async () => {
    if (!roomState || !currentRoom) return;

    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('room_id', currentRoom.id)
      .eq('round_number', roomState.current_round);

    if (error) {
      toast.error('Failed to load votes');
      return;
    }

    setVotes(data || []);
  };

  useEffect(() => {
    if (roomState && currentRoom) {
      loadVotes();
    }
  }, [roomState?.current_round]);

  const handleSelectRoom = (room: Room) => {
    setCurrentRoom(room);
    setAppState('joining');

    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleJoin = async (name: string, role: Role) => {
    if (!currentRoom) return;

    const existingParticipant = await supabase
      .from('participants')
      .select('*')
      .eq('room_id', currentRoom.id)
      .eq('name', name)
      .eq('is_online', true)
      .maybeSingle();

    if (existingParticipant.data) {
      toast.error('A user with this name is already in the room');
      return;
    }

    const sessionToken = generateSessionToken();

    const { data, error } = await supabase
      .from('participants')
      .insert({
        name,
        role,
        room_id: currentRoom.id,
        is_online: true,
        session_token: sessionToken,
        last_seen_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to join room');
      return;
    }

    if (role === 'PM' && !currentRoom.creator_id) {
      await supabase
        .from('rooms')
        .update({ creator_id: data.id })
        .eq('id', currentRoom.id);
    }

    saveSession(sessionToken, currentRoom.id);
    setCurrentUser(data);
    setAppState('in-room');
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

    clearSession();
    setCurrentUser(null);
    setCurrentRoom(null);
    setAppState('lobby');
  };

  const handleBackToLobby = () => {
    setCurrentRoom(null);
    setAppState('lobby');
  };

  if (appState === 'lobby') {
    return (
      <>
        <RoomLobby onSelectRoom={handleSelectRoom} />
        <Toaster />
      </>
    );
  }

  if (appState === 'joining' && currentRoom) {
    return (
      <>
        <JoinRoom room={currentRoom} onJoin={handleJoin} onBack={handleBackToLobby} />
        <Toaster />
      </>
    );
  }

  if (appState === 'in-room' && currentUser && currentRoom) {
    return (
      <>
        <PokerRoom
          currentUser={currentUser}
          room={currentRoom}
          participants={participants}
          votes={votes}
          roomState={roomState}
          onLeave={handleLeave}
        />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
      <Toaster />
    </>
  );
}

export default App;
