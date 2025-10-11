// Quest Challenge: Interactive mini-game UI
import React, { useState } from 'react';
import { Trophy, HelpCircle, X, Sparkles } from 'lucide-react';

interface Quest {
  id: string;
  type: string;
  prompt: string;
  solution?: string;
  hints: string[];
  difficulty: string;
  reward: number;
  attemptReward: number;
  characterName: string;
  options?: string[];
  isAnalysis?: boolean;
}

interface QuestChallengeProps {
  quest: Quest | null;
  onSubmit: (answer: string) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
}

export const QuestChallenge: React.FC<QuestChallengeProps> = ({
  quest,
  onSubmit,
  onClose,
  isSubmitting = false
}) => {
  const [answer, setAnswer] = useState('');
  const [currentHintIndex, setCurrentHintIndex] = useState(-1);
  const [showHint, setShowHint] = useState(false);

  if (!quest) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;
    
    await onSubmit(answer.trim());
    setAnswer('');
    setCurrentHintIndex(-1);
    setShowHint(false);
  };

  const handleShowHint = () => {
    if (currentHintIndex < quest.hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
      setShowHint(true);
    }
  };

  const getDifficultyColor = () => {
    switch (quest.difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  const getQuestTypeLabel = () => {
    switch (quest.type) {
      case 'riddle': return '🧩 Riddle';
      case 'trivia': return '🎯 Trivia';
      case 'word_game': return '📝 Word Game';
      case 'personality_quiz': return '💭 Personality Quiz';
      default: return '🎮 Challenge';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border-2 border-softgold-500/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-softgold-500/10 border-b border-softgold-500/30 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <Trophy className="w-6 h-6 text-softgold-400" />
            <h2 className="text-2xl font-bold text-white">
              {quest.characterName}'s Challenge
            </h2>
          </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <span className="px-3 py-1 bg-zinc-800/60 rounded-full text-softgold-300">
              {getQuestTypeLabel()}
            </span>
            <span className={`px-3 py-1 bg-zinc-800/60 rounded-full ${getDifficultyColor()}`}>
              {quest.difficulty}
            </span>
            <span className="text-zinc-400">
              Reward: <span className="text-softgold-400 font-semibold">+{quest.reward}</span> affection
            </span>
          </div>
        </div>

        {/* Quest Content */}
        <div className="p-6 space-y-6">
          {/* Prompt */}
          <div className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/50">
            <p className="text-lg text-zinc-100 leading-relaxed">
              {quest.prompt}
            </p>
          </div>

          {/* Multiple Choice Options (for personality quizzes) */}
          {quest.options && quest.options.length > 0 && (
            <div className="space-y-2">
              {quest.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setAnswer(option)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    answer === option
                      ? 'bg-softgold-500/20 border-2 border-softgold-500 text-white'
                      : 'bg-zinc-800/40 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/40'
                  }`}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              ))}
            </div>
          )}

          {/* Text Input (for riddles, trivia, word games) */}
          {(!quest.options || quest.options.length === 0) && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Your Answer:
                </label>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full px-4 py-3 bg-zinc-800/60 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-softgold-500 transition-colors"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
            </form>
          )}

          {/* Hint Section */}
          {quest.hints.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={handleShowHint}
                disabled={currentHintIndex >= quest.hints.length - 1}
                className={`flex items-center space-x-2 text-sm transition-colors ${
                  currentHintIndex >= quest.hints.length - 1
                    ? 'text-zinc-600 cursor-not-allowed'
                    : 'text-softgold-400 hover:text-softgold-300'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>
                  {currentHintIndex >= quest.hints.length - 1
                    ? 'No more hints available'
                    : `Get a hint (${quest.hints.length - currentHintIndex - 1} remaining)`}
                </span>
              </button>

              {showHint && currentHintIndex >= 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 animate-fade-in">
                  <div className="flex items-start space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-200">
                      {quest.hints[currentHintIndex]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-zinc-500">
              {quest.isAnalysis 
                ? 'Any answer helps me understand you better!' 
                : `Wrong answer? No worries! You'll still earn +${quest.attemptReward} for trying!`}
            </p>
            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || isSubmitting}
              className={`px-6 py-3 rounded-lg font-semibold transition-all transform ${
                !answer.trim() || isSubmitting
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-softgold-500 to-softgold-600 text-white hover:from-softgold-600 hover:to-softgold-700 hover:scale-105 shadow-lg hover:shadow-softgold-500/20'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Checking...</span>
                </span>
              ) : (
                'Submit Answer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestChallenge;

