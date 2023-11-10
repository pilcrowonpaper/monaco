# `@monaco-auth/core`

## Installation

```ts
npm install @monaco-auth/core
```

## Providers

### GitHub

- Login URL: `/login/github`
- Callback URL: `/login/github/callback` (e.g. `https://example.com/login/github/callback`)

```ts
import { GitHubProvider } from "@monaco-auth/core/providers";

const githubProvider = new GitHubProvider(clientId, clientSecret);
```

### Google

- Login URL: `/login/google`
- Callback URL: `/login/google/callback` (e.g. `https://example.com/login/google/callback`)

```ts
import { GoogleProvider } from "@monaco-auth/core/providers";

const googleProvider = new GoogleProvider(clientId, clientSecret);
```
