# `@monaco-auth/sveltekit`

SvelteKit integration for Monaco. For a full list of OAuth providers, see [`@lucia-auth/core`]().

## Installation

```
npm install @monaco-auth/sveltekit
```

## Usage

```ts
// src/hooks.server.ts
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
```
