import { PrismaAdapter } from "@monaco-auth/adapter-prisma";
import { monacoSvelteKit } from "@monaco-auth/sveltekit";
import { GitHubProvider } from "@monaco-auth/core/providers";
import { PrismaClient } from "@prisma/client";
import { dev } from "$app/environment";
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from "$env/static/private";

import type { Handle } from "@sveltejs/kit";

const client = new PrismaClient();

export const handle: Handle = monacoSvelteKit(new PrismaAdapter(client), {
	dev,
	providers: [new GitHubProvider(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)]
});
