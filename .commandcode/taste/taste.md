# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# nextjs

- In Next.js 16, the middleware file is `proxy.ts` (not `middleware.ts`). The exported function is `proxy()` with signature `(request: NextRequest)`. Confidence: 0.90

# git

- Use one-line commit messages. Keep them concise and descriptive. Confidence: 0.80

# architecture

- Prefer production-ready implementations over workarounds. Choose robust, scalable solutions even during development. Confidence: 0.75
- Use pnpm as the package manager for monorepo projects. Confidence: 0.75

# code-style

- Extract Zod schemas into separate `model.ts` files rather than co-locating them in route/endpoint files. Confidence: 0.70

# trpc

- For tRPC procedures with no input, use `z.preprocess()` to normalize empty objects `{}` to `undefined` before `z.void()` validation, since Express `json()` middleware leaves `req.body` as `{}` for bodyless POST requests. Confidence: 0.70

# design

- Prefer incremental improvements over full aesthetic revamps. Add components, elements, and animations rather than stripping existing design elements. Confidence: 0.75
