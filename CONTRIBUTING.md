# Contributing to fisc

Thanks for your interest in contributing. Here's how to get started.

## Setting up

```bash
git clone https://github.com/coalesc/fisc.git
cd fisc
npm install
npm run dev
```

## What we need most

### 1. Cell ID mappings

The hardest part of fisc is mapping vendor-neutral concept IDs to software-specific cell references. If you have access to Taxprep or DT Max and can document cell IDs for a tax year, that's extremely valuable.

Mappings go in `src/adapters/<software>/mappings/` as TypeScript objects keyed by tax year.

### 2. New adapters

Want to add support for Profile, Caseware, TurboTax Pro, or another package? Create a new directory under `src/adapters/` and implement the `Adapter` interface from `src/adapters/types.ts`.

### 3. New return types

We're starting with T1. T2 (corporate), T3 (trust), and T5013 (partnership) each need their own concept definitions in `src/concepts/`.

## Code style

- TypeScript strict mode
- Tabs for indentation
- No default exports

## Submitting changes

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to verify
5. Open a PR with a clear description of what you added

## Questions?

Open an issue or reach out at hello@coalesc.ai.
