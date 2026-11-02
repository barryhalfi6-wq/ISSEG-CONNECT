import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, Loader2 } from 'lucide-react';

interface AudioVoiceRecorderProps {
  onSendAudio: (audioDataUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const AudioVoiceRecorder: React.FC<AudioVoiceRecorderProps> = ({ onSendAudio, onCancel }) => {
  const [recording, setRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedAudio(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Impossible d\'accéder au microphone. Veuillez autoriser l\'accès dans les paramètres du navigateur.');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current && recordedAudio) {
      audioPlayerRef.current = new Audio(recordedAudio);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSend = () => {
    if (recordedAudio) {
      onSendAudio(recordedAudio, seconds || 1);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-2 bg-blue-50/80 p-2 rounded-2xl border border-blue-200 w-full animate-fade-in">
      {!recording && !recordedAudio && (
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-[#0878b9] font-medium flex items-center gap-1.5 pl-2">
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            Prêt à enregistrer une note vocale
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={startRecording}
              className="px-3 py-1.5 bg-[#0878b9] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm hover:bg-[#07558c]"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Démarrer</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {recording && (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 pl-2">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            <span className="text-xs font-mono font-bold text-rose-600">
              {formatSeconds(seconds)}
            </span>
            <span className="text-xs text-slate-500">Enregistrement vocal...</span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Terminer</span>
          </button>
        </div>
      )}

      {!recording && recordedAudio && (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 pl-1">
            <button
              type="button"
              onClick={togglePlayback}
              className="w-8 h-8 rounded-full bg-[#0878b9] text-white flex items-center justify-center shadow-xs hover:bg-[#07558c]"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <span className="text-xs font-mono font-bold text-slate-700">
              {formatSeconds(seconds)}
            </span>
            <span className="text-[11px] text-slate-500">Note vocale prête</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setRecordedAudio(null);
                setSeconds(0);
              }}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"
              title="Supprimer l'enregistrement"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="px-3.5 py-1.5 bg-[#0878b9] hover:bg-[#07558c] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
