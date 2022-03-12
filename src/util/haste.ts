import fetch from 'node-fetch';

const BASE = 'https://sourceb.in/';

export async function haste(title: string, content: string): Promise<{ key: string; url: string } | string> {
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	return new Promise(async (resolve, reject) => {
		const res = await fetch(`${BASE}api/bins/`, {
			method: 'POST',
			body: JSON.stringify({
				title,
				files: [
					{
						content,
					},
				],
			}),
			headers: { 'Content-Type': 'application/json' },
		});

		if (!res.ok) reject(res.statusText);

		const { key } = (await res.json()) as BinResponse;

		resolve({
			key,
			url: `${BASE}${key}`,
		});
	});
}

interface BinResponse {
	key: string;
	languages: number[];
}
