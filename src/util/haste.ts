import fetch from 'petitio';

const BASE = 'https://sourceb.in/';

export async function haste(title: string, content: string): Promise<{ key: string; url: string } | string> {
	const req = await fetch(`${BASE}api/bins/`, 'POST');
	req.body(
		JSON.stringify({
			title,
			files: [
				{
					content,
				},
			],
		})
	);
	req.header('content-type', 'application/json');

	const { key } = await req.json<BinResponse>();

	return {
		key,
		url: `${BASE}${key}`,
	};
}

interface BinResponse {
	key: string;
	languages: number[];
}
