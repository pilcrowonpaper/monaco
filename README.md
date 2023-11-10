# Monaco

A simple, lightweight alternative to Auth.js. This only supports OAuth and is intentionally made to be basic and opinionated. We recommend using [Lucia](https://monaco-auth.com) for something more flexible.

For a full list of OAuth providers, see [`@monaco-auth/core`](https://github.com/pilcrowOnPaper/monaco/tree/main/packages/core).

## Features and limitations

- Easy setup
- Sessions
- No custom user attributes
- No account linking
- Only supports OAuth
- Built-in providers

## Frameworks

### SvelteKit

See [`@monaco-auth/sveltekit`](https://github.com/pilcrowOnPaper/monaco/tree/main/packages/sveltekit) for using Monaco with SvelteKit.

```ts
import { PrismaAdapter } from "@monaco-auth/adapter-prisma";
import { monaco } from "@monaco-auth/sveltekit";
import { GitHubProvider } from "@monaco-auth/core/providers";
import { PrismaClient } from "@prisma/client";
import { dev } from "$app/environment";
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from "$env/static/private";

import type { Handle } from "@sveltejs/kit";

const client = new PrismaClient();

export const handle: Handle = monaco(new PrismaAdapter(client), {
	dev,
	providers: [new GitHubProvider(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)]
});
```

## Adapters

- [Prisma](https://github.com/pilcrowOnPaper/monaco/tree/main/packages/adapter-prisma)
