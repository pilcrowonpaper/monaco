import { defineConfig } from "astro/config";

import node from "@astrojs/node";

import { monaco } from "@monaco-auth/astro";
import { PrismaAdapter } from "@monaco-auth/adapter-prisma";
import { GitHubProvider } from "@monaco-auth/core/providers";

import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

// https://astro.build/config
export default defineConfig({
	integrations: [
		monaco(new PrismaAdapter(client), {
			providers: [
				new GitHubProvider(import.meta.env.GITHUB_CLIENT_ID, import.meta.env.GITHUB_CLIENT_SECRET)
			]
		})
	],
	output: "server",
	adapter: node({
		mode: "standalone"
	})
});
