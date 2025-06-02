'use client';

import { useState, useEffect, useCallback } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: (lang: string) => void;
  stopListening: () => void;
  error: string | null;
  browserSupportsSpeechRecognition: boolean;
}

const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setBrowserSupportsSpeechRecognition(true);
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const newRecognition = new SpeechRecognitionAPI();
        newRecognition.continuous = true;
        newRecognition.interimResults = true;
        setRecognition(newRecognition);
      }
    } else {
      setBrowserSupportsSpeechRecognition(false);
    }
  }, []);

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    if (finalTranscript) {
      setTranscript(prev => prev + finalTranscript);
    }
  }, []);

  const handleError = useCallback((event: SpeechRecognitionErrorEvent) => {
    setError(event.error);
    setIsListening(false);
  }, []);

  const handleEnd = useCallback(() => {
    setIsListening(false);
  }, []);

  const startListening = useCallback((lang: string) => {
    if (recognition && !isListening) {
      recognition.lang = lang;
      setTranscript(''); // Clear previous transcript
      setError(null);
      try {
        recognition.start();
        setIsListening(true);
      } catch (e: any) {
        setError(e.message || 'Failed to start recognition.');
        setIsListening(false);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      if (isListening) {
        recognition.stop();
      }
    };
  }, [recognition, handleResult, handleError, handleEnd, isListening]);

  return { isListening, transcript, startListening, stopListening, error, browserSupportsSpeechRecognition };
};

export default useSpeechRecognition;
