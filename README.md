# RootGuard

RootGuard is a GenLayer upgrade-control console for intelligent contracts. It turns a native GenVM upgrader address into a public, reviewable process: a frozen safety charter, consensus review of public source, a mandatory challenge window, and a finalized contract-to-contract upgrade.

It is not an off-chain code-review assistant. The contract owns the target registry, maintainer permissions, proposals, consensus verdicts, source hash, challenge state, execution queue, and completion record. The Next.js app reads that state and sends the contract writes that move it forward.

## The trust problem

Upgradeable contracts are often protected by one administrator key. That key can replace production code immediately, even if users have no practical way to inspect the change, contest it, or know whether the published source is the code that was installed.

RootGuard gives a target contract one explicit upgrade authority: the RootGuard contract. An upgrade can only happen after the candidate source has been fetched and reviewed by GenLayer validators against a target-specific charter. An approval remains challengeable for a fixed on-chain interval. At execution time RootGuard fetches the candidate again and refuses to emit the upgrade if its SHA-256 hash differs from the reviewed source.

## Lifecycle

1. Deploy RootGuard with a challenge window of at least five minutes.
2. Deploy a compatible target and append RootGuard's address to its native `Root.get().upgraders` list.
3. The target steward registers it with a public source URL and an immutable safety charter.
4. The steward or a delegated maintainer submits a versioned candidate source URL and a substantive change summary.
5. Anyone runs `review_upgrade`. Validators fetch the current and candidate source with strict equality, then independently compare their actual code against the charter.
6. Only an `APPROVE` with `MEDIUM` or `HIGH` confidence opens the mandatory challenge window.
7. Anyone may open one evidence-backed challenge before the deadline. `review_challenge` performs a new comparative consensus review using the public challenge evidence.
8. After an unchallenged approval window, anyone can call `execute_upgrade`. RootGuard re-fetches and hash-checks the candidate, then emits a finalized `upgrade(bytes)` message to the protected target.
9. Anyone calls `confirm_execution` once the child transaction finalizes. RootGuard reads the target version and marks the proposal `EXECUTED` only when it matches.

## Why GenLayer is central

- `strict_eq` fetches the same public source for every validator and binds the execution bytes to the reviewed SHA-256 hash.
- `prompt_comparative` asks validators to independently inspect code, storage layout, authority, value movement, external calls, and the target charter. It does not accept format-only validation.
- Native Root Slot upgradability locks the target's code so RootGuard is the authority allowed to change it.
- Finalized intelligent-contract messages carry the upgrade into the protected target only after the RootGuard execution transaction is final.
- The target's actual `get_version()` is read after execution before RootGuard records success.

## Project structure

```
contracts/RootGuard.py             Central state machine and consensus review logic
contracts/ProtectedCounterV1.py    Reference protected target
contracts/ProtectedCounterV2.py    Storage-compatible upgrade used in the live proof
contracts/RootGuardSpike.py        Narrow cross-contract feasibility controller
tests/direct/                      Fast validation and state-boundary tests
tests/integration/                 StudioNet finalized-message upgrade proof
src/                               Next.js contract-driven console
```

## Run locally

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set these values in `.env.local`:

```dotenv
NEXT_PUBLIC_ROOTGUARD_CONTRACT=0xYourDeployedRootGuardAddress
NEXT_PUBLIC_GENLAYER_ENDPOINT=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_CHAIN=studionet
```

The app intentionally has no backend, database, or API route. Contract data is the source of truth. A connected injected wallet or an explicitly created/imported browser wallet signs writes; disconnecting only clears the current browser session and never deletes a saved browser key.

## Verify

```powershell
# Contract lint
& "C:\Users\USER\AppData\Local\Python\pythoncore-3.14-64\Scripts\genvm-lint.exe" check contracts\RootGuard.py --json

# Direct contract tests
python -m pytest tests\direct -v

# Cross-contract StudioNet proof
& "C:\Users\USER\AppData\Local\Python\pythoncore-3.14-64\Scripts\gltest.exe" tests\integration\test_upgrade_path.py -v -s --network studionet

# Frontend production build
npm run build
```

Current verification:

- `RootGuard.py`, `ProtectedCounterV1.py`, and `ProtectedCounterV2.py` pass `genvm-lint`.
- The direct suite has 8 passing tests for constructor safety, input validation, invalid states, and pagination.
- One StudioNet integration proof deployed a RootGuard controller and protected target, registered the authorized target, and recorded a maintainer proposal through the full controller state machine.
- A second StudioNet proof deployed the focused controller and protected target, incremented v1 state, emitted a finalized upgrade, confirmed v2 retained the value, and confirmed the v2-only method before incrementing again.
- The Next.js production build passes and the console has been checked without browser console errors at desktop and 390px mobile widths.

## Important operational boundary

RootGuard judges source supplied at public URLs. For production use, use immutable, commit-pinned URLs such as `raw.githubusercontent.com/<org>/<repo>/<40-character-commit>/<path>`. The contract re-fetches the exact candidate at execution and checks its reviewed hash, so a mutable branch URL will fail closed if it changes after review. The initial current-source pointer is the steward's declared baseline; each subsequent RootGuard-executed upgrade is byte-bound by the contract itself.
