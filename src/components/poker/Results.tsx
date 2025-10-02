import { type Participant, type Vote, type RoomState } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp } from 'lucide-react';

interface ResultsProps {
  participants: Participant[];
  votes: Vote[];
  roomState: RoomState;
}

export function Results({ participants, votes, roomState }: ResultsProps) {
  const calculateRoleAverage = (role: string) => {
    const roleParticipants = participants.filter((p) => p.role === role);
    const roleVotes = votes.filter((v) =>
      roleParticipants.some((p) => p.id === v.participant_id)
    );

    if (roleVotes.length === 0) return null;

    const sum = roleVotes.reduce((acc, vote) => acc + vote.points, 0);
    return sum / roleVotes.length;
  };

  const getMultiplier = (role: string) => {
    switch (role) {
      case 'front-end':
        return roomState.fe_multiplier;
      case 'back-end':
        return roomState.be_multiplier;
      case 'QA':
        return roomState.qa_multiplier;
      default:
        return 1;
    }
  };

  const calculateAdjustedAverage = (role: string) => {
    const avg = calculateRoleAverage(role);
    if (avg === null) return null;
    return avg * getMultiplier(role);
  };

  const overallAverage = () => {
    if (votes.length === 0) return 0;
    const sum = votes.reduce((acc, vote) => acc + vote.points, 0);
    return sum / votes.length;
  };

  const roles = ['front-end', 'back-end', 'QA', 'PM'];

  const roleLabels = {
    'front-end': 'Front-End',
    'back-end': 'Back-End',
    'QA': 'QA',
    'PM': 'PM',
  };

  const roleColors = {
    'front-end': 'bg-blue-100 text-blue-800 border-blue-300',
    'back-end': 'bg-green-100 text-green-800 border-green-300',
    'QA': 'bg-orange-100 text-orange-800 border-orange-300',
    'PM': 'bg-purple-100 text-purple-800 border-purple-300',
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Overall Average
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-blue-600">
            {overallAverage().toFixed(1)} points
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role-Based Averages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role) => {
              const avg = calculateRoleAverage(role);
              const adjustedAvg = calculateAdjustedAverage(role);
              const multiplier = getMultiplier(role);
              const hasMultiplier = role !== 'PM' && multiplier !== 1;

              if (avg === null) {
                return (
                  <div
                    key={role}
                    className={`p-4 rounded-lg border-2 ${roleColors[role as keyof typeof roleColors]}`}
                  >
                    <Badge variant="secondary" className="mb-2">
                      {roleLabels[role as keyof typeof roleLabels]}
                    </Badge>
                    <p className="text-sm text-slate-600">No votes yet</p>
                  </div>
                );
              }

              return (
                <div
                  key={role}
                  className={`p-4 rounded-lg border-2 ${roleColors[role as keyof typeof roleColors]}`}
                >
                  <Badge variant="secondary" className="mb-2">
                    {roleLabels[role as keyof typeof roleLabels]}
                  </Badge>
                  <div>
                    <p className="text-3xl font-bold">{avg.toFixed(1)}</p>
                    {hasMultiplier && adjustedAvg !== null && (
                      <div className="mt-2 pt-2 border-t border-slate-300">
                        <p className="text-xs text-slate-600">With multiplier ({multiplier}x):</p>
                        <p className="text-2xl font-bold text-slate-700">{adjustedAvg.toFixed(1)}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
