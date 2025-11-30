import { redirect } from 'next/navigation';

export default function Page() {
	redirect('/landing');
	return (
		<div>
			<div>main</div>
		</div>
	);
}
