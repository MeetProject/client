import Image, { StaticImageData } from 'next/image';

interface EmojiButtonProperties {
	src: StaticImageData;
	name: string;
	onClick: () => void;
}
export default function EmojiButton({ name, onClick, src }: EmojiButtonProperties) {
	const handleButtonClick = () => {
		onClick();
	};
	return (
		<button
			className='flex size-10 items-center justify-center rounded-full bg-[#2C2C2C] hover:bg-[#333333] active:bg-[#454646]'
			type='button'
			onClick={handleButtonClick}
		>
			<Image alt={name} height={24} src={src} width={24} />
		</button>
	);
}
