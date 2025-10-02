import { type Participant, type Vote, type RoomState } from '../lib/supabase';
import { Header } from './poker/Header';
import { ParticipantsList } from './poker/ParticipantsList';
import { VotingCards } from './poker/VotingCards';
import { Results } from './poker/Results';
import { PMControls } from './poker/PMControls';

interface PokerRoomProps {
  currentUser: Participant;
  participants: Participant[];
  votes: Vote[];
  roomState: RoomState | null;
  onLeave: () => void;
}

export function PokerRoom({ currentUser, participants, votes, roomState, onLeave }: PokerRoomProps) {
  const isPM = currentUser.role === 'PM';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header currentUser={currentUser} onLeave={onLeave} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <ParticipantsList
          participants={participants}
          votes={votes}
          isRevealed={roomState?.is_revealed || false}
          currentRound={roomState?.current_round || 1}
        />

        {!roomState?.is_revealed && (
          <VotingCards
            currentUser={currentUser}
            votes={votes}
            currentRound={roomState?.current_round || 1}
          />
        )}

        {roomState?.is_revealed && (
          <Results
            participants={participants}
            votes={votes}
            roomState={roomState}
          />
        )}

        {isPM && roomState && (
          <PMControls
            roomState={roomState}
            hasVotes={votes.length > 0}
          />
        )}
      </main>
    </div>
  );
}
