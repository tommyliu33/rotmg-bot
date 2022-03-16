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

	const res = await req.send();
	if (!(res.statusCode! >= 200 && res.statusCode! < 300)) {
		throw new Error(`Code '${res.statusCode!}' while creating bin`);
	}

	const { key } = await res.json<BinResponse>();

	return {
		key,
		url: `${BASE}${key}`,
	};
}

interface BinResponse {
	key: string;
	languages: number[];
}
