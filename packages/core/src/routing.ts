export function getRoute(method: string, path: string): Route | null {
	const pathChunks = path.split("/");
	if (method === "GET" && pathChunks.length === 3 && pathChunks[1] === "login") {
		return {
			type: "login",
			providerId: pathChunks[2]!
		};
	}
	if (
		(method === "GET" || method === "POST") &&
		pathChunks.length === 4 &&
		pathChunks[1] === "login" &&
		pathChunks[3] === "callback"
	) {
		return {
			type: "callback",
			providerId: pathChunks[2]!
		};
	}
	if (method === "POST" && pathChunks.length === 2 && pathChunks[1] === "logout") {
		return {
			type: "logout"
		};
	}
	return null;
}

export type Route = LoginRoute | CallbackRoute | LogoutRoute;

export interface LoginRoute {
	type: "login";
	providerId: string;
}

export interface CallbackRoute {
	type: "callback";
	providerId: string;
}

export interface LogoutRoute {
	type: "logout";
}
