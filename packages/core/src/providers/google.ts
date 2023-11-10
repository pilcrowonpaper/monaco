import { Google, OAuth2RequestError, generateState } from "arctic";
import { getBaseURL } from "../core.js";

import type { OAuthAuthorizationContext, Provider, ProviderUser } from "../core.js";

export class GoogleProvider implements Provider {
	public id = "google";

	private oauth: Google;

	constructor(clientId: string, clientSecret: string) {
		const redirectURI = getBaseURL() + "/login/google/callback";
		this.oauth = new Google(clientId, clientSecret, redirectURI, {
			scope: ["https://www.googleapis.com/auth/userinfo.email"]
		});
	}

	public async createAuthorizationURL(): Promise<[url: URL, context: OAuthAuthorizationContext]> {
		const state = generateState();
		const url = await this.oauth.createAuthorizationURL(state);
		const context: OAuthAuthorizationContext = {
			state,
			codeVerifier: null
		};
		return [url, context];
	}

	public async validateCallback(
		searchParams: URLSearchParams,
		context: OAuthAuthorizationContext
	): Promise<ProviderUser | null> {
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		if (!code || !state || !context.state || state !== context.state) {
			return null;
		}
		try {
			const tokens = await this.oauth.validateAuthorizationCode(code);
			const googleUser = await this.oauth.getUser(tokens.accessToken);
			const providerUser: ProviderUser = {
				id: googleUser.sub,
				email: googleUser.email ?? null,
				emailVerified: googleUser.email_verified ?? false,
				profileImage: googleUser.picture,
				username: googleUser.name
			};
			return providerUser;
		} catch (e) {
			if (e instanceof OAuth2RequestError && e.message === "invalid_request") {
				// invalid code
				return null;
			}
			throw e;
		}
	}
}
