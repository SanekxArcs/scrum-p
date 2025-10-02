import { type Participant, type Vote } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { CircleCheck as CheckCircle2, Circle } from 'lucide-react';

interface ParticipantsListProps {
  participants: Participant[];
  votes: Vote[];
  isRevealed: boolean;
  currentRound: number;
}

export function ParticipantsList({ participants, votes, isRevealed }: ParticipantsListProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasVoted = (participantId: string) => {
    return votes.some((vote) => vote.participant_id === participantId);
  };

  const getVote = (participantId: string) => {
    return votes.find((vote) => vote.participant_id === participantId);
  };

  const roleColors = {
    'front-end': 'bg-blue-500',
    'back-end': 'bg-green-500',
    'QA': 'bg-orange-500',
    'PM': 'bg-purple-500',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Team Members ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {participants.map((participant) => {
            const voted = hasVoted(participant.id);
            const vote = getVote(participant.id);

            return (
              <div
                key={participant.id}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 bg-white hover:shadow-md transition-shadow"
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback className={roleColors[participant.role]}>
                    {getInitials(participant.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-medium text-sm text-slate-900">{participant.name}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {participant.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  {voted ? (
                    isRevealed && vote ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-bold text-lg">{vote.points}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">Voted</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-1 text-slate-400">
                      <Circle className="w-4 h-4" />
                      <span className="text-sm">Waiting</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
