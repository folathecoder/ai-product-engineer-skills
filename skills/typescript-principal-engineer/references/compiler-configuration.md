# TypeScript Compiler Configuration (`tsconfig.json`)

> **Purpose**: Authoritative enterprise reference for compiler configurations, module resolution strategies (`NodeNext` vs `Bundler`), and performance flags.

---

## 1. Enterprise-Grade Base Configuration

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    /* Language & Target */
    "target": "ES2024",
    "lib": ["ES2024"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    /* Strict Type-Checking (The Core Dial) */
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    /* Advanced Defenses */
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,

    /* Module & Interop */
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,

    /* Performance & Soundness */
    "skipLibCheck": true,
    "isolatedModules": true
  }
}
```

---

## 2. Module Resolution Strategies: `NodeNext` vs. `Bundler`

### When to Use `NodeNext`
- **Context**: Backend Node.js services, npm packages, libraries intended to be consumed anywhere.
- **Behavior**: Mimics Node's actual ESM and CommonJS loader algorithms.
- **Rules**:
  - Relative imports **must** have file extensions (`import './foo.js'`).
  - Considers `package.json` `"type": "module"` and `"exports"` maps strictly.
  - Rejects extensionless imports.

### When to Use `Bundler`
- **Context**: Modern frontend applications bundled by Next.js, Vite, Turbopack, or Webpack.
- **Behavior**: Relaxes extension requirements while respecting `package.json` `"exports"` conditions.
- **Rules**:
  - Allows extensionless imports and CSS/asset imports (`import './styles.css'`).
  - Must be paired with `"module": "ESNext"`.

---

## 3. Advanced Flags Explained

### `noUncheckedIndexedAccess`
By default, indexing into an array (`arr[0]`) yields the element type `T`, even if the array is empty at runtime. With `noUncheckedIndexedAccess: true`, indexing yields `T | undefined`:
```ts
const names: string[] = []
const first = names[0] // Type is string | undefined
// first.toUpperCase() // ❌ Object is possibly 'undefined'
first?.toUpperCase()   // ✅ Safe
```

### `exactOptionalPropertyTypes`
Prevents passing `{ prop: undefined }` when the interface specifies optional omission `{ prop?: string }`:
```ts
interface Options {
  timeout?: number
}
// With exactOptionalPropertyTypes:
const opt1: Options = {} // ✅ Valid (omitted)
const opt2: Options = { timeout: 5000 } // ✅ Valid
// const opt3: Options = { timeout: undefined } // ❌ Error: Type 'undefined' is not assignable to type 'number'
```

### `isolatedDeclarations` (TS 5.5+)
Requires exported declarations to have explicit, self-contained types without relying on complex deep inference. This allows fast build tools like `oxc`, `swc`, and `esbuild` to generate `.d.ts` declaration files in parallel without running full type-checking.
