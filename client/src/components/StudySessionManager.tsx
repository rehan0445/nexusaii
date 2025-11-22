import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, Square, Users, Clock, Coffee, Target } from 'lucide-react';

interface StudySession {
  id: string;
  name: string;
  duration: number; // in seconds
  timeRemaining: number;
  isActive: boolean;
  isPaused: boolean;
  participants: string[];
  startTime?: Date;
  type: 'pomodoro' | 'custom' | 'group';
  breakDuration?: number;
  currentCycle: number;
  totalCycles: number;
}

interface StudySessionManagerProps {
  onSessionUpdate: (session: StudySession | null) => void;
  participants: string[];
  currentUser: string;
}

export function StudySessionManager({ onSessionUpdate, participants, currentUser }: StudySessionManagerProps) {
  const [session, setSession] = useState<StudySession | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionDuration, setSessionDuration] = useState(25);
  const [sessionType, setSessionType] = useState<'pomodoro' | 'custom' | 'group'>('pomodoro');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (session && session.isActive && !session.isPaused && session.timeRemaining > 0) {
      interval = setInterval(() => {
        setSession(prev => {
          if (!prev) return null;
          
          const newTimeRemaining = prev.timeRemaining - 1;
          
          if (newTimeRemaining <= 0) {
            // Session completed
            const updatedSession = {
              ...prev,
              timeRemaining: 0,
              isActive: false,
              currentCycle: prev.currentCycle + 1
            };
            
            // Check if it's a pomodoro cycle
            if (prev.type === 'pomodoro' && prev.currentCycle < prev.totalCycles) {
              // Start break
              const breakSession = {
                ...updatedSession,
                name: `Break ${prev.currentCycle}`,
                duration: prev.breakDuration || 5 * 60,
                timeRemaining: prev.breakDuration || 5 * 60,
                isActive: true
              };
              onSessionUpdate(breakSession);
              return breakSession;
            } else {
              // Session fully completed
              onSessionUpdate(null);
              return null;
            }
          }
          
          const updatedSession = { ...prev, timeRemaining: newTimeRemaining };
          onSessionUpdate(updatedSession);
          return updatedSession;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [session, onSessionUpdate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const createSession = (type: 'pomodoro' | 'custom' | 'group', duration: number, name?: string) => {
    const newSession: StudySession = {
      id: Date.now().toString(),
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Session`,
      duration: duration * 60,
      timeRemaining: duration * 60,
      isActive: true,
      isPaused: false,
      participants: [currentUser],
      startTime: new Date(),
      type,
      breakDuration: type === 'pomodoro' ? 5 * 60 : undefined,
      currentCycle: 1,
      totalCycles: type === 'pomodoro' ? 4 : 1
    };
    
    setSession(newSession);
    onSessionUpdate(newSession);
    setShowCreateModal(false);
    setSessionName('');
    setSessionDuration(25);
  };

  const pauseSession = () => {
    if (session) {
      const updatedSession = { ...session, isPaused: !session.isPaused };
      setSession(updatedSession);
      onSessionUpdate(updatedSession);
    }
  };

  const stopSession = () => {
    setSession(null);
    onSessionUpdate(null);
  };

  const joinSession = () => {
    if (session && !session.participants.includes(currentUser)) {
      const updatedSession = {
        ...session,
        participants: [...session.participants, currentUser]
      };
      setSession(updatedSession);
      onSessionUpdate(updatedSession);
    }
  };

  const getProgressPercentage = () => {
    if (!session) return 0;
    return ((session.duration - session.timeRemaining) / session.duration) * 100;
  };

  if (!session) {
    return (
      <div className="bg-zinc-800/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Timer className="w-5 h-5 mr-2" />
            Study Sessions
          </h3>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => createSession('pomodoro', 25)}
            className="w-full p-3 bg-red-600/20 border border-red-600/30 rounded-lg text-red-300 hover:bg-red-600/30 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center">
              <Timer className="w-5 h-5 mr-2" />
              <div className="text-left">
                <div className="font-medium">Pomodoro (25 min)</div>
                <div className="text-sm opacity-70">4 cycles with breaks</div>
              </div>
            </div>
            <Play className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => createSession('custom', 60)}
            className="w-full p-3 bg-blue-600/20 border border-blue-600/30 rounded-lg text-blue-300 hover:bg-blue-600/30 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <div className="text-left">
                <div className="font-medium">Focus Session (1 hour)</div>
                <div className="text-sm opacity-70">Deep work session</div>
              </div>
            </div>
            <Play className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full p-3 bg-green-600/20 border border-green-600/30 rounded-lg text-green-300 hover:bg-green-600/30 transition-colors flex items-center justify-center"
          >
            <Target className="w-5 h-5 mr-2" />
            Custom Session
          </button>
        </div>
        
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-bold text-white mb-4">Create Custom Session</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Session Name</label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    placeholder="e.g., Math Study Session"
                  />
                </div>
                
                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(parseInt(e.target.value) || 25)}
                    className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    min="1"
                    max="240"
                  />
                </div>
                
                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Type</label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value as any)}
                    className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="custom">Custom</option>
                    <option value="pomodoro">Pomodoro</option>
                    <option value="group">Group Study</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createSession(sessionType, sessionDuration, sessionName || undefined)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
                >
                  Start Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Timer className="w-5 h-5 mr-2" />
          {session.name}
        </h3>
        {session.type === 'pomodoro' && (
          <div className="flex items-center space-x-2">
            <Coffee className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-orange-400">
              Cycle {session.currentCycle}/{session.totalCycles}
            </span>
          </div>
        )}
      </div>
      
      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className="text-4xl font-mono font-bold text-white mb-2">
          {formatTime(session.timeRemaining)}
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              session.type === 'pomodoro' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        <div className="text-sm text-zinc-400">
          {session.isActive && !session.isPaused ? 'In Progress' : 
           session.isPaused ? 'Paused' : 'Completed'}
        </div>
      </div>
      
      {/* Participants */}
      {session.participants.length > 1 && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Users className="w-4 h-4 text-zinc-400 mr-2" />
            <span className="text-sm text-zinc-400">
              {session.participants.length} participants
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.participants.map((participant, index) => (
              <div key={index} className="px-2 py-1 bg-zinc-700/50 rounded-full text-xs text-zinc-300">
                {participant === currentUser ? 'You' : participant}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Controls */}
      <div className="flex space-x-2">
        {session.isActive && (
          <button
            onClick={pauseSession}
            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center ${
              session.isPaused 
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            {session.isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
            {session.isPaused ? 'Resume' : 'Pause'}
          </button>
        )}
        
        <button
          onClick={stopSession}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <Square className="w-4 h-4 mr-2" />
          Stop
        </button>
        
        {!session.participants.includes(currentUser) && (
          <button
            onClick={joinSession}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
          >
            Join
          </button>
        )}
      </div>
      
      {/* Session Info */}
      <div className="mt-4 p-3 bg-zinc-900/30 rounded-lg">
        <div className="text-xs text-zinc-400 space-y-1">
          <div>Started: {session.startTime?.toLocaleTimeString()}</div>
          <div>Duration: {Math.floor(session.duration / 60)} minutes</div>
          {session.type === 'pomodoro' && (
            <div>Break: {Math.floor((session.breakDuration || 0) / 60)} minutes</div>
          )}
        </div>
      </div>
    </div>
  );
} 