import { SessionController, SessionCookieController } from "oslo/session";
import { TimeSpan } from "oslo";
import { generateRandomString, alphabet } from "oslo/random";
import { getRoute, resolvePathname, sanitizePathname } from "./routing.js";

import type { CookieAttributes } from "oslo/cookie";
import type { Route } from "./routing.js";

export class Core {
	private adapter: Adapter;
	private providers: Provider[];
	private controller = new SessionController(new TimeSpan(30, "d"));
	private sessionCookieController: SessionCookieController;
	private secureCookie: boolean;

	constructor(
		adapter: Adapter,
		options?: {
			providers?: Provider[];
			secureCookie?: boolean;
			baseURL?: string;
		}
	) {
		this.adapter = adapter;
		this.providers = options?.providers ?? [];
		this.secureCookie = options?.secureCookie ?? true;
		this.sessionCookieController = new SessionCookieController(
			"session",
			this.controller.expiresIn,
			{
				secure: this.secureCookie
			}
		);
	}

	public async handleLoginRequest(providerId: string): Promise<MonacoResponse> {
		const provider = this.providers.find((provider) => provider.id === providerId) ?? null;
		if (!provider) {
			return new ErrorResponse(404);
		}
		const cookies: Cookie[] = [];
		const [url, context] = await provider.createAuthorizationURL();
		if (context.state !== null) {
			const stateCookie: Cookie = {
				name: "oauth_state",
				value: context.state,
				attributes: {
					httpOnly: true,
					secure: this.secureCookie,
					path: "/",
					sameSite: "none",
					maxAge: 10 * 60
				}
			};
			cookies.push(stateCookie);
		}
		if (context.codeVerifier !== null) {
			const codeVerifierCookie: Cookie = {
				name: "code_verifier",
				value: context.codeVerifier,
				attributes: {
					httpOnly: true,
					secure: this.secureCookie,
					path: "/",
					sameSite: "none",
					maxAge: 10 * 60
				}
			};
			cookies.push(codeVerifierCookie);
		}
		return new RedirectResponse(url.toString(), cookies);
	}

	public async handleCallbackRequest(
		providerId: string,
		request: MonacoRequest
	): Promise<MonacoResponse> {
		const provider = this.providers.find((provider) => provider.id === providerId) ?? null;
		if (!provider) {
			return new ErrorResponse(400);
		}
		const context: OAuthAuthorizationContext = {
			state: request.cookies.get("oauth_state") ?? null,
			codeVerifier: request.cookies.get("code_verifier") ?? null
		};
		const providerUser = await provider.validateCallback(request.searchParams, context);
		if (!providerUser) {
			return new ErrorResponse(400);
		}
		const oauthId = provider.id + ":" + providerUser.id;
		const existingUser = await this.adapter.getUserByOAuthId(oauthId);
		const cookies: Cookie[] = [];
		if (existingUser) {
			const session = await this.createSession(existingUser.id);
			cookies.push(this.sessionCookieController.createSessionCookie(session.id));
			return new RedirectResponse("/", cookies);
		}
		const user: User = {
			id: generateRandomString(15, alphabet("0-9", "a-z")),
			email: providerUser.email,
			emailVerified: providerUser.emailVerified,
			username: providerUser.username,
			oauthId,
			profileImage: providerUser.profileImage
		};
		await this.adapter.setUser(user);
		const session = await this.createSession(user.id);
		cookies.push(this.sessionCookieController.createSessionCookie(session.id));
		return new RedirectResponse("/", cookies);
	}

	public async handleLogoutRequest(request: MonacoRequest): Promise<MonacoResponse> {
		const cookies: Cookie[] = [];
		const sessionId = request.cookies.get("session");
		if (!sessionId) {
			return new ErrorResponse(401);
		}
		const [session, user] = await this.adapter.getSessionAndUser(sessionId);
		cookies.push(this.sessionCookieController.createBlankSessionCookie());
		if (!session || !user) {
			return new ErrorResponse(401, cookies);
		}
		const sessionState = this.controller.getSessionState(session.expiresAt);
		if (sessionState === "expired") {
			return new ErrorResponse(401, cookies);
		}
		await this.adapter.deleteSession(session.id);
		return new RedirectResponse("/", cookies);
	}

	public async validateSession(
		request: MonacoRequest
	): Promise<[user: User | null, cookies: Cookie[]]> {
		const cookies: Cookie[] = [];
		const sessionId = request.cookies.get("session");
		if (!sessionId) {
			return [null, cookies];
		}
		const [session, user] = await this.adapter.getSessionAndUser(sessionId);
		if (!session || !user) {
			return [null, cookies];
		}
		const sessionState = this.controller.getSessionState(session.expiresAt);
		if (sessionState === "expired") {
			cookies.push(this.sessionCookieController.createBlankSessionCookie());
			return [null, cookies];
		}
		if (sessionState === "idle") {
			const newExpiration = this.controller.createExpirationDate();
			await this.adapter.updateSession(session.id, {
				expiresAt: newExpiration
			});
			cookies.push(this.sessionCookieController.createSessionCookie(sessionId));
		}
		return [user, cookies];
	}

	public getRoute(method: string, pathname: string): Route | null {
		const resolvedPathname = resolvePathname(
			sanitizePathname(pathname),
			new URL(getBaseURL()).pathname
		);
		if (!resolvedPathname) {
			return null;
		}
		return getRoute(method, resolvedPathname);
	}

	private async createSession(userId: string): Promise<Session> {
		const sessionId = generateRandomString(40, alphabet("0-9", "a-z"));
		const expiresAt = this.controller.createExpirationDate();
		const session = {
			id: sessionId,
			expiresAt,
			userId
		};
		await this.adapter.setSession(session);
		return session;
	}
}

export interface MonacoRequest {
	pathname: string;
	searchParams: URLSearchParams;
	cookies: Map<string, string>;
}

export class RedirectResponse {
	public readonly type = "redirect";
	public status = 302;
	public redirectTo: string;
	public cookies: Cookie[];

	constructor(redirectTo: string, cookies?: Cookie[]) {
		this.redirectTo = redirectTo;
		this.cookies = cookies ?? [];
	}
}

export class ErrorResponse {
	public readonly type = "error";
	public status = 302;
	public cookies: Cookie[];

	constructor(status: number, cookies?: Cookie[]) {
		this.status = status;
		this.cookies = cookies ?? [];
	}
}

export type MonacoResponse = RedirectResponse | ErrorResponse;

export interface Adapter {
	getSessionAndUser(sessionId: string): Promise<[session: Session | null, user: User | null]>;
	setSession(session: Session): Promise<void>;
	deleteSession(sessionId: string): Promise<void>;
	updateSession(sessionId: string, session: Partial<Session>): Promise<void>;
	setUser(user: User): Promise<void>;
	getUserByOAuthId(oauthId: string): Promise<User | null>;
}

export interface Provider {
	id: string;
	createAuthorizationURL(): Promise<[url: URL, context: OAuthAuthorizationContext]>;
	validateCallback(
		searchParams: URLSearchParams,
		context: OAuthAuthorizationContext
	): Promise<ProviderUser | null>;
}

export interface OAuthAuthorizationContext {
	state: string | null;
	codeVerifier: string | null;
}

export interface Cookie {
	name: string;
	value: string;
	attributes: CookieAttributes;
}

export interface ProviderUser {
	id: string;
	username: string;
	email: string | null;
	profileImage: string | null;
	emailVerified: boolean;
}

export interface User {
	id: string;
	username: string;
	email: string | null;
	profileImage: string | null;
	emailVerified: boolean;
	oauthId: string;
}

export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
}

export function getBaseURL(): string {
	let baseURL = process.env.MONACO_BASE_URL;
	if (!baseURL) {
		throw new Error("env var MONACO_URL not defined");
	}
	if (baseURL.endsWith("/")) {
		baseURL = baseURL.split("/").slice(0, -1).join("/")
	}
	return baseURL
}
