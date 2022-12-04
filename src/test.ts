import { writeFileSync } from 'fs';
import { resolve } from 'path';

import { getKeypair } from '.';

const beautifyToken = (token: string): string =>
	token.slice(0, 4) + '...' + token.slice(-4);

(async () => {
	const keys = await getKeypair();

	const accessPretty = beautifyToken(keys.accessToken);
	const expiryPretty = keys.expiry.fromNow();
	console.log(`access token: ${accessPretty} (expires in ${expiryPretty})`);

	const refreshPretty = beautifyToken(keys.refreshToken);
	console.log(`refresh token: ${refreshPretty}`);

	const path = resolve('./bsg-token.json');
	const content = JSON.stringify(
		{
			access_token: keys.accessToken,
			refresh_token: keys.refreshToken,
			expires: keys.expiry.toISOString(),
		},
		null,
		4,
	);
	writeFileSync(path, content);
})().catch(console.error);
