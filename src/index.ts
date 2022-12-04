import { createDecipheriv, createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import WMI from 'node-wmi';

const FALLBACK_ENCRYPTION_KEY = 'b.s.g*l.a.u.n.c.h.e.r';

dayjs.extend(relativeTime);

export type BsgSettings = {
	login: string; // email
	at: string; // access token (aes encrypted)
	atet: string; // access token expiry time
	rt: string; // refresh token (aes encrypted)
};

function getProcessorId() {
	return new Promise<string>((resolve, reject) => {
		WMI.Query<{ ProcessorId: string }>(
			{ class: 'Win32_Processor' },
			function (err, result) {
				if (err) reject(err);
				else resolve(result[0].ProcessorId);
			},
		);
	});
}

export async function getEncryptionKey() {
	const id = (await getProcessorId()) ?? FALLBACK_ENCRYPTION_KEY;
	return createHash('sha256').update(id).digest();
}

export function getSettings() {
	try {
		const appdata = process.env['APPDATA'];
		if (!appdata) throw new Error('APPDATA missing from environment!');

		const path = join(
			appdata,
			'Battlestate Games',
			'BsgLauncher',
			'settings',
		);

		const content = readFileSync(path, 'utf8');
		return JSON.parse(content) as BsgSettings;
	} catch (e) {
		console.error('Failed to get settings file:', e);
		process.exit(1);
	}
}

function decrypt(ciphertext: string, key: Buffer) {
	const buf = Buffer.from(ciphertext, 'base64');
	const iv = buf.subarray(0, 16);
	const data = buf.subarray(16);
	const decipher = createDecipheriv('aes-256-cbc', key, iv);
	return Buffer.concat([decipher.update(data), decipher.final()]).toString(
		'utf8',
	);
}

export async function getKeypair() {
	const settings = getSettings();
	const key = await getEncryptionKey();
	return {
		accessToken: decrypt(settings.at, key),
		refreshToken: decrypt(settings.rt, key),
		expiry: dayjs(settings.atet),
	};
}
