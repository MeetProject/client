import { useEffect, useRef } from 'react';

interface Props {
  stream: MediaStream;
}

export default function VideoPlayer({ stream }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream;
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline muted className='size-full' />;
}
