import { Core } from "@monaco-auth/core";
import { redirect, error } from "@sveltejs/kit";

import type { Adapter, MonacoRequest, Provider, User } from "@monaco-auth/core";
import type { Cookies as SvelteKitCookies } from "@sveltejs/kit";

export function monacoSvelteKit(
	adapter: Adapter,
	options?: {
		providers?: Provider[];
		dev?: boolean;
	}
): HandleHook {
	const dev = options?.dev ?? false;
	const core = new Core(adapter, {
		providers: options?.providers,
		secureCookie: !dev
	});

	return async ({ event, resolve }): Promise<Response> => {
		const request = createMonacoRequestFromSvelteKitEvent(event);
		const [user, cookies] = await core.validateSession(request);
		for (const cookie of cookies) {
			event.cookies.set(cookie.name, cookie.value, cookie.attributes);
		}
		event.locals.user = user;

		const route = core.getRoute(event.request.method, event.url.pathname);
		if (!route) {
			return await resolve(event);
		}

		if (route.type === "login") {
			const response = await core.handleLoginRequest(route.providerId);
			for (const cookie of response.cookies) {
				event.cookies.set(cookie.name, cookie.value, cookie.attributes);
			}
			if (response.type === "redirect") {
				throw redirect(302, response.redirectTo);
			}
			throw error(response.status);
		}

		if (route.type === "callback") {
			const response = await core.handleCallbackRequest(route.providerId, request);
			for (const cookie of response.cookies) {
				event.cookies.set(cookie.name, cookie.value, cookie.attributes);
			}
			if (response.type === "redirect") {
				throw redirect(302, response.redirectTo);
			}
			throw error(response.status);
		}
		if (route.type === "logout") {
			const response = await core.handleLogoutRequest(request);
			for (const cookie of response.cookies) {
				event.cookies.set(cookie.name, cookie.value, cookie.attributes);
			}
			if (response.type === "redirect") {
				throw redirect(302, response.redirectTo);
			}
			throw error(response.status);
		}
		return await resolve(event);
	};
}

function createMonacoRequestFromSvelteKitEvent(event: SvelteKitEvent): MonacoRequest {
	const request: MonacoRequest = {
		cookies: new Map<string, string>(event.cookies.getAll().map((val) => [val.name, val.value])),
		pathname: event.url.pathname,
		searchParams: event.url.searchParams
	};
	return request;
}

type HandleHook = (arg: {
	event: SvelteKitEvent;
	resolve: (event: any) => Promise<Response> | Response;
}) => Promise<Response>;

interface SvelteKitEvent {
	request: Request;
	cookies: SvelteKitCookies;
	locals: Locals;
	url: URL;
}

interface Locals {
	user: User | null;
}
