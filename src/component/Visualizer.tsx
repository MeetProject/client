import { useVolume } from '@/hook';

interface VisualizerProperties {
	stream: MediaStream | null | undefined;
}

export default function Visualizer({ stream }: VisualizerProperties) {
	const { volume } = useVolume(stream);
	const convertValue = (value: number) => {
		if (value >= 20) {
			return 12;
		}
		if (value <= 6) {
			return (value / 6) * 6;
		}
		return ((value - 7) / (19 - 7)) * (12 - 6) + 6;
	};
	return (
		<div
			className='flex size-[26px] items-center justify-center gap-[2px] rounded-full'
			style={{ backgroundColor: 'rgba(26, 115, 232, 0.9)' }}
		>
			<div className='w-1 rounded-full bg-white' style={{ height: `${4 + convertValue(volume) / 2}px` }} />
			<div className={`w-1 rounded-full bg-white `} style={{ height: `${4 + convertValue(volume)}px` }} />
			<div className={`w-1 rounded-full bg-white `} style={{ height: `${4 + convertValue(volume) / 2}px` }} />
		</div>
	);
}
