# `@monaco-auth/adapter-prisma`

## Installation

```
npm install @monaco-auth/adapter-prisma
```

## Usage

```ts
import { PrismaAdapter } from "@monaco-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const adapter = new PrismaAdapter(client);
```

```prisma
model User {
  id            String    @id
  username      String
  email         String?
  emailVerified Boolean
  oauthId       String    @unique
  profileImage  String?
  sessions      Session[]
}

model Session {
  id        String   @id
  expiresAt DateTime
  userId    String
  user      User     @relation(fields: [userId], references: [id])
}
```
