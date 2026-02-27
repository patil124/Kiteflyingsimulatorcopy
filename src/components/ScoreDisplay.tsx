import { ScoreState } from '../App';
import { Card } from './ui/card';
import { Trophy, Clock, Mountain, Zap, Target, Star } from 'lucide-react';

interface ScoreDisplayProps {
  score: ScoreState;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <>
      <div className="bg-black/15 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1">
            <Trophy className="size-3 sm:size-4 text-yellow-400" />
            <span className="text-white text-sm sm:text-base">{score.totalScore.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="size-2.5 sm:size-3 text-yellow-400" />
            <span className="text-white/80 text-sm sm:text-base">{score.itemsCollected}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="size-2.5 sm:size-3 text-purple-400" />
            <span className="text-white/80 text-sm sm:text-base">{score.tricksPerformed}</span>
          </div>
        </div>
      </div>

      {score.currentCombo > 1 && (
        <div className="mt-1.5 sm:mt-2 bg-gradient-to-r from-orange-500/90 to-red-500/90 backdrop-blur-sm text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-center shadow-lg text-sm sm:text-base">
          🔥 {score.currentCombo}x COMBO!
        </div>
      )}
    </>
  );
}