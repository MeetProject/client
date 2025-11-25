'use client';

import { useEffect, useState, useRef } from 'react';

const useVolume = (stream: MediaStream | null | undefined) => {
  const animationReference = useRef<number | null>(null);
  const [volume, setVolume] = useState(0);
  const [isExpand, setIsExpand] = useState(false);
  const dataArrayReference = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      return;
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    dataArrayReference.current = dataArray;

    const updateVolume = () => {
      animationReference.current = requestAnimationFrame(updateVolume);
      if (!dataArrayReference.current) {
        return;
      }
      analyser.getByteFrequencyData(dataArrayReference.current);

      const sum = dataArrayReference.current.reduce((a, b) => a + b, 0);
      const avg = sum / dataArray.length;

      setVolume((previous) => {
        setIsExpand(avg > previous);
        return avg;
      });
    };

    updateVolume();

    return () => {
      audioContext.close();
      if (animationReference.current !== null) {
        cancelAnimationFrame(animationReference.current);
      }
    };
  }, [stream]);

  return { isExpand, volume };
};

export default useVolume;
