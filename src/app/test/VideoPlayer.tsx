import { useEffect, useRef } from 'react';

interface Props {
  stream: MediaStream;
}

export default function VideoPlayer({ stream }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  console.log('render');

  useEffect(() => {
    if (!videoRef.current) return;

    const liveTracks = stream?.getTracks().filter((t) => t.readyState === 'live');
    const safeStream = new MediaStream(liveTracks);

    videoRef.current.srcObject = safeStream;
    videoRef.current.play().catch(() => {});
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline className='size-full' />;
}
