import { useState, useEffect } from 'react';
import { type Participant, type Vote, supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface VotingCardsProps {
  currentUser: Participant;
  votes: Vote[];
  currentRound: number;
}

const FIBONACCI_VALUES = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

export function VotingCards({ currentUser, votes, currentRound }: VotingCardsProps) {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  const currentVote = votes.find((vote) => vote.participant_id === currentUser.id);

  useEffect(() => {
    if (currentVote) {
      setSelectedValue(currentVote.points);
    } else {
      setSelectedValue(null);
    }
  }, [currentVote]);

  const handleVote = async (points: number) => {
    if (currentVote) {
      const { error } = await supabase
        .from('votes')
        .update({ points })
        .eq('id', currentVote.id);

      if (error) {
        toast.error('Failed to update vote');
        return;
      }
    } else {
      const { error } = await supabase
        .from('votes')
        .insert({
          participant_id: currentUser.id,
          round_number: currentRound,
          points,
        });

      if (error) {
        toast.error('Failed to submit vote');
        return;
      }
    }

    setSelectedValue(points);
    toast.success('Vote submitted');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Choose Your Estimate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-3">
          {FIBONACCI_VALUES.map((value) => (
            <Button
              key={value}
              variant={selectedValue === value ? 'default' : 'outline'}
              className={cn(
                'h-20 text-2xl font-bold transition-all hover:scale-105',
                selectedValue === value && 'ring-2 ring-blue-500 ring-offset-2'
              )}
              onClick={() => handleVote(value)}
            >
              {value}
            </Button>
          ))}
        </div>
        {selectedValue !== null && (
          <p className="text-center text-sm text-slate-600 mt-4">
            You voted: <span className="font-bold text-lg">{selectedValue}</span> points
          </p>
        )}
      </CardContent>
    </Card>
  );
}
