import { GitHub, OAuth2RequestError, generateState } from "arctic";

import type { OAuthAuthorizationContext, Provider, ProviderUser } from "../core.js";

export class GitHubProvider implements Provider {
	public id = "github";
	public name = "GitHub";

	private oauth: GitHub;

	constructor(clientId: string, clientSecret: string) {
		this.oauth = new GitHub(clientId, clientSecret, {
			scope: ["user:email"]
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
			const githubUser = await this.oauth.getUser(tokens.accessToken);
			const emailResponse = await fetch("https://api.github.com/user/emails", {
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`,
					Accepts: "application/json"
				}
			});
			const emails: GithubUserEmail[] = await emailResponse.json();
			const primaryEmail = emails.find((val) => val.primary) ?? null;
			const providerUser: ProviderUser = {
				id: githubUser.id.toString(),
				email: primaryEmail?.email ?? null,
				emailVerified: primaryEmail?.verified ?? false,
				profileImage: githubUser.avatar_url,
				username: githubUser.login
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

interface GithubUserEmail {
	email: string;
	verified: boolean;
	primary: boolean;
}
