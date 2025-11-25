import { useEffect, useRef } from 'react';

interface OtherAudioStreamProperties {
  otherStreams: [string, MediaStream][];
  color: string;
  name: string;
}

export default function OtherAudioStream({ color, name, otherStreams }: OtherAudioStreamProperties) {
  const audioReference = useRef<HTMLAudioElement>(null);
  const audioContextReference = useRef<AudioContext | null>(null);
  const destinationReference = useRef<MediaStreamAudioDestinationNode | null>(null);

  useEffect(() => {
    if (!audioContextReference.current) {
      const audioContext = new AudioContext();
      audioContextReference.current = audioContext;
    }

    if (!destinationReference.current) {
      const destination = audioContextReference.current.createMediaStreamDestination();
      destinationReference.current = destination;
    }

    const currentSources = new Set<MediaStreamAudioSourceNode>();

    otherStreams.forEach(([, stream]) => {
      const audioTrack = stream.getAudioTracks();
      if (audioTrack.length > 0 && audioContextReference.current && destinationReference.current) {
        const audioSource = audioContextReference.current.createMediaStreamSource(new MediaStream(audioTrack));
        audioSource.connect(destinationReference.current);
        currentSources.add(audioSource);
      }
    });

    if (audioReference.current) {
      audioReference.current.srcObject = destinationReference.current.stream;
    }

    return () => {
      if (destinationReference.current) {
        currentSources.forEach((sourceNode) => {
          sourceNode.disconnect(destinationReference.current!);
        });
        currentSources.clear();
      }
    };
  }, [otherStreams]);

  return (
    <div className='relative flex size-full flex-col items-center justify-center overflow-hidden rounded-lg'>
      <div className='absolute left-0 top-0 z-20 size-full bg-[#3C4043]'>
        <div
          className='absolute left-1/2 top-1/2 flex aspect-square h-2/5 -translate-x-1/2 -translate-y-1/2 items-center justify-center truncate rounded-full font-bold text-white'
          style={{ backgroundColor: color, fontSize: '150%' }}
        >
          {name.slice(0, 3)}
        </div>
        <p className='absolute bottom-3 left-1/2 -translate-x-1/2 text-white' style={{ fontSize: '100%' }}>
          {`외 ${otherStreams.length - 1}명`}
        </p>
      </div>
      <audio ref={audioReference} autoPlay />
    </div>
  );
}
