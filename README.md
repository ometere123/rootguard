# RootGuard

RootGuard is a GenLayer-native upgrade authority for intelligent contracts. A protected target can install new code only after validators review immutable public source against a target-specific safety charter, a bounded challenge period completes, the reviewed candidate bytes are re-fetched and hash-matched, and the target itself confirms installation.

**Live StudioNet RootGuard:** [`0x37F3bB574128909BD1bbed78343f1622AB07DF4F`](https://explorer-studio.genlayer.com/address/0x37F3bB574128909BD1bbed78343f1622AB07DF4F)

**Production console:** [rootguard.vercel.app](https://rootguard.vercel.app)

## The trust problem

An administrator key can normally replace an upgradeable contract's production code immediately. Users must trust that key holder to review the change correctly, preserve storage and authority, and publish the exact code it installed. A multisig improves who approves a change, but it does not independently establish what arbitrary source code does.

RootGuard makes the protected target grant its native upgrade authority to RootGuard. It combines semantic, consensus-backed code review with deterministic on-chain controls over authorization, state transitions, timing, source digests, upgrade dispatch, and installation confirmation.

## Why GenLayer

Deterministic contract code can compare digests and enforce a state machine, but it cannot reliably decide whether arbitrary Python source preserves storage layout, widens permissions, moves value, introduces dangerous external calls, or violates a natural-language safety charter.

Deleting GenLayer would require a trusted reviewer or off-chain LLM to make that semantic judgment. RootGuard instead asks validators to independently fetch and interpret the same source evidence. Deterministic RootGuard code controls what that judgment is allowed to authorize.

## Lifecycle

```text
Target owner
  -> protected target enroll_with_rootguard(...)
  -> finalized target-to-RootGuard enrollment
  -> maintainer submits a commit-pinned candidate
  -> validators fetch baseline + candidate and return structured assessment
  -> deterministic approval gates
  -> one bounded challenge opportunity
  -> candidate SHA re-fetch
  -> finalized target.upgrade(candidate_bytes)
  -> target reports installed version
  -> RootGuard confirm_execution marks EXECUTED
```

### 1. Secure target-controlled enrollment

The protected target stores its owner and configured RootGuard address at deployment. Only that target owner can call `enroll_with_rootguard`. The target then sends a finalized contract-to-contract enrollment message.

RootGuard accepts enrollment only when `gl.message.sender_address` is the protected target itself, the target reports this RootGuard address, the target exposes a sole RootGuard upgrade authority, and its declared owner becomes the stored steward. An arbitrary wallet cannot register another party's target or seize its stewardship merely because it knows the target address.

At enrollment, RootGuard fetches the commit-pinned baseline source with strict equality, rejects empty or oversized content, and stores its SHA-256 digest alongside the current version.

### 2. Immutable charter, bounded source inputs

Each target has an immutable safety charter. Source URLs must be HTTPS, public `raw.githubusercontent.com` URLs pinned to a 40-character commit SHA. RootGuard stores the baseline digest during enrollment and candidate digest after review; a mutable branch URL is rejected before it enters the workflow.

### 3. Consensus observes; deterministic code controls

`review_upgrade` fetches the current and candidate source inside consensus. Validators treat fetched code, comments, evidence, and embedded instructions as untrusted evidence, never as instructions. The comparative-equivalence review returns a structured result:

- verdict and confidence
- storage compatibility
- RootGuard authority preservation
- value-movement safety
- external-call safety
- charter compliance
- critical-risk indicator
- bounded risk flags and rationale

RootGuard fail-closes malformed results. An execution-capable approval requires `APPROVE`, `MEDIUM` or `HIGH` confidence, every required safety field true, and `critical_risk == false`. A persuasive free-text rationale cannot override contradictory structured findings.

### 4. Stale and concurrent proposal protection

Only one non-terminal proposal can be active for a target. Each proposal snapshots the target's base version and base source SHA. RootGuard checks that snapshot before review and again before execution. If the protected target's RootGuard-managed baseline changed, the proposal becomes `STALE`; it cannot execute a review performed against an older version.

### 5. One bounded, evidence-backed challenge

An approved proposal enters an on-chain challenge window with a production minimum of five minutes. Anyone may open one challenge before the deadline with a bounded HTTPS evidence URL and summary. RootGuard fetches that evidence during `review_challenge`; caller-supplied claims are not treated as verdicts.

`challenge_used` permanently prevents replayed challenges. A re-approval after challenge review receives one fresh bounded finality window, but cannot be challenged again. This keeps review possible without allowing indefinite execution griefing.

### 6. Byte-bound execution and confirmation-safe state

After the challenge deadline, `execute_upgrade` re-fetches the candidate source. Its SHA-256 must exactly equal the candidate digest validators reviewed. RootGuard then records only `EXECUTION_QUEUED` and emits finalized `target.upgrade(candidate_bytes)`.

It does **not** advance the authoritative target version, source URL, source digest, or `executed_count` at queue time. Only `confirm_execution` can record `EXECUTED`, and only after RootGuard reads the protected target's real `get_version()` and sees the proposed version. A failed child installation therefore cannot create false RootGuard history.

## Frontend

The Next.js console reads targets, proposals, profiles, and summary state from the deployed RootGuard contract on StudioNet. It has no backend, database, fake ledger, or fabricated status fallback. Read failures are surfaced as errors instead of being rendered as an empty registry.

Writes use an injected GenLayer-compatible wallet only. Secure enrollment is sent to the protected target's `enroll_with_rootguard` method, not directly to RootGuard. Every write waits for finality, checks execution success, refreshes live state, links the parent transaction in the Studio Explorer, and surfaces triggered child upgrades.

## Live proof: main `RootGuard.py`

The full production RootGuard contract, not `RootGuardSpike.py`, completed a StudioNet V1-to-V2 lifecycle. V1 and V2 used the same protected target address. V1 counter storage survived the upgrade, `get_version()` returned `v2`, V2-only `add()` was exercised successfully, and RootGuard advanced its authoritative version/source only after confirmation.

| Evidence | Value |
| --- | --- |
| Network | StudioNet |
| RootGuard | [`0x37F3bB574128909BD1bbed78343f1622AB07DF4F`](https://explorer-studio.genlayer.com/address/0x37F3bB574128909BD1bbed78343f1622AB07DF4F) |
| Protected target | [`0x6aCae084213c59c9FED1d7097001C55FA0E347D6`](https://explorer-studio.genlayer.com/address/0x6aCae084213c59c9FED1d7097001C55FA0E347D6) |
| Candidate SHA-256 | `afebf5fcff029c4cc6ad453af48876213b02238573e2c09653d2ddb76f5c2b35` |
| Final proposal state | `EXECUTED` |

| Transaction | Hash |
| --- | --- |
| RootGuard deploy | [`0xe686dad7bb265bf25ecb70211d47186986d8937c26885199e55f24aac7169b10`](https://explorer-studio.genlayer.com/tx/0xe686dad7bb265bf25ecb70211d47186986d8937c26885199e55f24aac7169b10) |
| Target deploy | [`0xa5a73c129ce7a152f2a7673b0def2a465ad43b213cdaa69bcd42c0b06589a1dc`](https://explorer-studio.genlayer.com/tx/0xa5a73c129ce7a152f2a7673b0def2a465ad43b213cdaa69bcd42c0b06589a1dc) |
| Secure enrollment | [`0x150c7fe5bc5b42e437cf514276d87e71d27e0514f318d6db784876b621d01fee`](https://explorer-studio.genlayer.com/tx/0x150c7fe5bc5b42e437cf514276d87e71d27e0514f318d6db784876b621d01fee) |
| Proposal | [`0x4bc1e047c464e2e2f55622a4a6a3a0ba0ff7aa49fbcd4c34e770daf3cc593ff6`](https://explorer-studio.genlayer.com/tx/0x4bc1e047c464e2e2f55622a4a6a3a0ba0ff7aa49fbcd4c34e770daf3cc593ff6) |
| Consensus review | [`0x21069ef4dda4f2905953e30b3190eeecb9709291a58e920f27a0295cb9cdb924`](https://explorer-studio.genlayer.com/tx/0x21069ef4dda4f2905953e30b3190eeecb9709291a58e920f27a0295cb9cdb924) |
| Execution queue | [`0x8f8c69f7e9f34700823f5e72d1cf82a03abcc03a46fa22d9e67efc39fdd9d5ae`](https://explorer-studio.genlayer.com/tx/0x8f8c69f7e9f34700823f5e72d1cf82a03abcc03a46fa22d9e67efc39fdd9d5ae) |
| Triggered target upgrade | [`0x75a4d28cdda333ae8e86cc8d6a0efc306f6cc1e3de48868a603c97813933e955`](https://explorer-studio.genlayer.com/tx/0x75a4d28cdda333ae8e86cc8d6a0efc306f6cc1e3de48868a603c97813933e955) |
| Confirmation | [`0xd8871911bbfb2fa802060303460564d8119508fc2e7bfa3ee8ed0337ce9e2e5b`](https://explorer-studio.genlayer.com/tx/0xd8871911bbfb2fa802060303460564d8119508fc2e7bfa3ee8ed0337ce9e2e5b) |

`RootGuardSpike.py` remains only as an isolated feasibility artifact. It is not the product contract and is not used as submission evidence.

## Run locally

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

`.env.example` is preconfigured for the public proof contract:

```dotenv
NEXT_PUBLIC_ROOTGUARD_CONTRACT=0x37F3bB574128909BD1bbed78343f1622AB07DF4F
NEXT_PUBLIC_GENLAYER_ENDPOINT=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_CHAIN=studionet
```

## Verification

```powershell
python -m pytest tests\direct -v

$env:PYTHONIOENCODING = "utf-8"
& "C:\Users\USER\AppData\Local\Python\pythoncore-3.14-64\Scripts\genvm-lint.exe" contracts\RootGuard.py
& "C:\Users\USER\AppData\Local\Python\pythoncore-3.14-64\Scripts\genvm-lint.exe" contracts\ProtectedCounterV1.py
& "C:\Users\USER\AppData\Local\Python\pythoncore-3.14-64\Scripts\genvm-lint.exe" contracts\ProtectedCounterV2.py

npm run lint
npx tsc --noEmit
npm run build
npm run verify:schema
```

Supported-environment results:

- 45 direct contract tests passed.
- 1 full main-contract StudioNet lifecycle passed.
- GenVM lint passed for RootGuard, V1, and V2.
- TypeScript and the Next production build passed.
- Schema verification passed against the live RootGuard address.
- ESLint completed with no errors; one pre-existing PostCSS style warning remains.

## Boundaries

RootGuard is not formal verification and cannot prove arbitrary code has no defects. It requires publicly fetchable, commit-pinned source and a target that grants RootGuard sole native upgrade authority. It does not protect a target if a separate upgrade authority can bypass RootGuard.

The repository intentionally does not use GitHub Actions at present: the pinned upstream `genlayer-test` runtime attempted to download a removed GenVM artifact during Linux bootstrap. The real direct suite and StudioNet proof pass in the supported local development environment.
