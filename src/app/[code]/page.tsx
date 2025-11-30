import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import Provider from './Provider';

export default async function Page() {
	const headerList = await headers();
	const domain = headerList.get('x-pathname');

	if (!domain) {
		redirect('/landing');
	}

	return <Provider />;
}
