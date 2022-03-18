import fetch from 'petitio';

const UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36';
const API = (apiKey: string, url: string) => `https://api.ocr.space/parse/imageurl?apikey=${apiKey}&url=${url}`;

async function isImage(url: string): Promise<boolean> {
	const req = await fetch(url, 'HEAD');
	req.header('user-agent', UA);

	const res = await req.send();
	const contentType = res.headers['content-type'] as string;

	return contentType.split('/')[0] === 'image';
}

export async function parse(url: string): Promise<OCRApiResponse> {
	if (!(await isImage(url))) throw new Error('Not an image');

	const req = await fetch(API(process.env.OCR_SPACE_API_KEY!, url));
	req.header('user-agent', UA);

	const res = await req.send();
	if (!(res.statusCode! >= 200 && res.statusCode! < 300)) {
		throw new Error(`Received code '${res.statusCode!}' during request`);
	}

	return req.json<OCRApiResponse>();
}

// Types from AnthonyLzq/ocr-space-api-alt2
// Copyright (c) 2020 AnthonyLzq. All rights reserved. MIT license.

interface OCRApiResponse {
	ParsedResults: ParsedResult[];
	OCRExitCode: number;
	IsErroredOnProcessing: boolean;
	ProcessingTimeInMilliseconds: string;
	SearchablePDFURL: string;
	ErrorMessage: string | undefined;
	ErrorDetails: string | undefined;
}

interface ParsedResult {
	Lines: Line[];
	HasOverlay: boolean;
	Message: string | null;
	TextOrientation: string;
	FileParseExitCode: number;
	ParsedText: string;
	ErrorMessage: string;
	ErrorDetails: string;
}

interface Line {
	Words: Word[];
	MaxHeight: number;
	MinTop: number;
}

interface Word {
	WordText: string;
	Left: number;
	Top: number;
	Height: number;
	Width: number;
}
