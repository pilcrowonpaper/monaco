import { Core } from "@monaco-auth/core";

import type { Adapter, Provider } from "@monaco-auth/core";
import type { AstroIntegration } from "astro";

export let core: Core;

export function monaco(
	adapter: Adapter,
	options?: {
		providers?: Provider[];
		dev?: boolean;
	}
): AstroIntegration {
	const dev = options?.dev ?? false;
	core = new Core(adapter, {
		providers: options?.providers,
		secureCookie: !dev
	});
	return {
		name: "monaco-astro",
		hooks: {
			"astro:config:setup": ({ addMiddleware }): void => {
				const middlewareFile = import.meta.url
					.replace("file://", "")
					.replace("/index.js", "/middleware.js");
				addMiddleware({
					order: "pre",
					entrypoint: middlewareFile
				});
			}
		}
	};
}
