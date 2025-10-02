import { useState, useEffect } from 'react';
import { type RoomState, supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Eye, RotateCcw, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface PMControlsProps {
  roomState: RoomState;
  hasVotes: boolean;
}

export function PMControls({ roomState, hasVotes }: PMControlsProps) {
  const [feMultiplier, setFeMultiplier] = useState(roomState.fe_multiplier);
  const [beMultiplier, setBeMultiplier] = useState(roomState.be_multiplier);
  const [qaMultiplier, setQaMultiplier] = useState(roomState.qa_multiplier);

  useEffect(() => {
    setFeMultiplier(roomState.fe_multiplier);
    setBeMultiplier(roomState.be_multiplier);
    setQaMultiplier(roomState.qa_multiplier);
  }, [roomState]);

  const handleRevealVotes = async () => {
    const { error } = await supabase
      .from('room_state')
      .update({ is_revealed: true, updated_at: new Date().toISOString() })
      .eq('id', roomState.id);

    if (error) {
      toast.error('Failed to reveal votes');
      return;
    }

    toast.success('Votes revealed');
  };

  const handleResetRound = async () => {
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('round_number', roomState.current_round);

    if (deleteError) {
      toast.error('Failed to reset round');
      return;
    }

    const { error: updateError } = await supabase
      .from('room_state')
      .update({
        current_round: roomState.current_round + 1,
        is_revealed: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomState.id);

    if (updateError) {
      toast.error('Failed to reset round');
      return;
    }

    toast.success('New round started');
  };

  const handleUpdateMultipliers = async () => {
    const { error } = await supabase
      .from('room_state')
      .update({
        fe_multiplier: feMultiplier,
        be_multiplier: beMultiplier,
        qa_multiplier: qaMultiplier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomState.id);

    if (error) {
      toast.error('Failed to update multipliers');
      return;
    }

    toast.success('Multipliers updated');
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            PM Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            {!roomState.is_revealed ? (
              <Button
                onClick={handleRevealVotes}
                disabled={!hasVotes}
                className="flex-1"
                size="lg"
              >
                <Eye className="w-4 h-4 mr-2" />
                Reveal Votes
              </Button>
            ) : (
              <Button onClick={handleResetRound} className="flex-1" size="lg" variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Start New Round
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Multipliers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fe-multiplier">Front-End Multiplier</Label>
              <Input
                id="fe-multiplier"
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={feMultiplier}
                onChange={(e) => setFeMultiplier(parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="be-multiplier">Back-End Multiplier</Label>
              <Input
                id="be-multiplier"
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={beMultiplier}
                onChange={(e) => setBeMultiplier(parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qa-multiplier">QA Multiplier</Label>
              <Input
                id="qa-multiplier"
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={qaMultiplier}
                onChange={(e) => setQaMultiplier(parseFloat(e.target.value))}
              />
            </div>
          </div>
          <Button onClick={handleUpdateMultipliers} className="w-full">
            Update Multipliers
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
