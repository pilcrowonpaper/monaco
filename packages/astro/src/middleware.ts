import { shared } from "./shared.js";
import { parseCookies } from "oslo/cookie";

import type { MonacoRequest } from "@monaco-auth/core";
import type { APIContext, MiddlewareNext } from "astro";

export async function onRequest(
	context: APIContext,
	next: MiddlewareNext<Response>
): Promise<Response> {
	const request = createMonacoRequestFromAPIContext(context);
	const [user, cookies] = await shared.core.validateSession(request);
	for (const cookie of cookies) {
		context.cookies.set(cookie.name, cookie.value, cookie.attributes);
	}
	context.locals.user = user;

	const route = shared.core.getRoute(context.request.method, context.url.pathname);
	if (!route) {
		return await next();
	}

	if (route.type === "login") {
		const response = await shared.core.handleLoginRequest(route.providerId);
		for (const cookie of response.cookies) {
			context.cookies.set(cookie.name, cookie.value, cookie.attributes);
		}
		if (response.type === "redirect") {
			return context.redirect(response.redirectTo);
		}
		return new Response(null, {
			status: response.status
		});
	}

	if (route.type === "callback") {
		const response = await shared.core.handleCallbackRequest(route.providerId, request);
		for (const cookie of response.cookies) {
			context.cookies.set(cookie.name, cookie.value, cookie.attributes);
		}
		if (response.type === "redirect") {
			return context.redirect(response.redirectTo);
		}
		return new Response(null, {
			status: response.status
		});
	}
	if (route.type === "logout") {
		const response = await shared.core.handleLogoutRequest(request);
		for (const cookie of response.cookies) {
			context.cookies.set(cookie.name, cookie.value, cookie.attributes);
		}
		if (response.type === "redirect") {
			return context.redirect(response.redirectTo);
		}
		return new Response(null, {
			status: response.status
		});
	}
	return await next();
}

function createMonacoRequestFromAPIContext(context: APIContext): MonacoRequest {
	const request: MonacoRequest = {
		cookies: parseCookies(context.request.headers.get("Cookie") ?? ""),
		pathname: context.url.pathname,
		searchParams: context.url.searchParams
	};
	return request;
}
