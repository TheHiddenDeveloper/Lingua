'use client';

import { useState, useEffect, useCallback } from 'react';

interface TextToSpeechHook {
  isSpeaking: boolean;
  speak: (text: string, lang: string) => void;
  cancel: () => void;
  error: string | null;
  browserSupportsTextToSpeech: boolean;
  availableVoices: SpeechSynthesisVoice[];
}

const useTextToSpeech = (): TextToSpeechHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [browserSupportsTextToSpeech, setBrowserSupportsTextToSpeech] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setBrowserSupportsTextToSpeech(true);
      const synth = window.speechSynthesis;
      setSpeechSynthesis(synth);
      
      const loadVoices = () => {
        const voices = synth.getVoices();
        setAvailableVoices(voices);
      };
      
      loadVoices();
      // Some browsers load voices asynchronously.
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
      }
    } else {
      setBrowserSupportsTextToSpeech(false);
    }
  }, []);
  
  const speak = useCallback((text: string, lang: string) => {
    if (!speechSynthesis || isSpeaking || !text) return;

    setError(null);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    const voice = availableVoices.find(v => v.lang.startsWith(lang) || v.lang.replace('-', '_').startsWith(lang.replace('-', '_')));
    if (voice) {
      utterance.voice = voice;
    } else if (availableVoices.length > 0) {
        // Fallback to first available voice if specific language not found
        // console.warn(`No voice found for lang ${lang}, using default.`);
    }


    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      setError(event.error || 'Speech synthesis error');
      setIsSpeaking(false);
    };

    speechSynthesis.speak(utterance);
  }, [speechSynthesis, isSpeaking, availableVoices]);

  const cancel = useCallback(() => {
    if (speechSynthesis && isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [speechSynthesis, isSpeaking]);

  return { isSpeaking, speak, cancel, error, browserSupportsTextToSpeech, availableVoices };
};

export default useTextToSpeech;
