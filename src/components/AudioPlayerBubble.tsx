import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerBubbleProps {
  audioUrl: string;
  durationSeconds?: number;
  isMine?: boolean;
}

export const AudioPlayerBubble: React.FC<AudioPlayerBubbleProps> = ({
  audioUrl,
  durationSeconds = 0,
  isMine = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          const current = audioRef.current.currentTime;
          const total = audioRef.current.duration || durationSeconds || 1;
          setProgress((current / total) * 100);
        }
      };
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`flex items-center gap-2.5 p-2 rounded-2xl min-w-[180px] max-w-[260px] ${
        isMine ? 'bg-[#0878b9] text-white' : 'bg-slate-100 text-slate-800'
      }`}
    >
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs transition-transform active:scale-95 ${
          isMine ? 'bg-white text-[#0878b9]' : 'bg-[#0878b9] text-white'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex-1">
        {/* Progress bar track */}
        <div className={`h-1.5 rounded-full overflow-hidden ${isMine ? 'bg-white/30' : 'bg-slate-300'}`}>
          <div
            className={`h-full transition-all duration-150 ${isMine ? 'bg-white' : 'bg-[#0878b9]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] mt-1 opacity-80">
          <span className="flex items-center gap-1 font-mono">
            <Volume2 className="w-3 h-3" />
            Note vocale
          </span>
          <span className="font-mono">{formatSec(durationSeconds || 0)}</span>
        </div>
      </div>
    </div>
  );
};
