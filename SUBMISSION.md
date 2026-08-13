# RootGuard Submission Evidence

## Product

RootGuard is a GenLayer-native upgrade authority that allows intelligent contracts to replace production code only after consensus-backed source review, an on-chain challenge window, byte-level source binding, finalized contract-to-contract execution, and target confirmation.

## Problem

Upgradeable contracts are commonly controlled by administrator keys. Even when teams are honest, users must trust a small group to decide whether a code change preserves storage, permissions, upgrade authority, and funds safety, and to install exactly the source they reviewed.

## Why GenLayer

Arbitrary source code cannot be semantically evaluated by deterministic smart-contract logic alone. A deterministic contract can compare hashes and enforce state transitions, but cannot determine whether a diff changes storage layout, widens permissions, moves value, or violates a natural-language charter.

An off-chain LLM API would become a trusted review oracle. RootGuard asks GenLayer validators to independently fetch and assess the source evidence, while deterministic contract logic constrains every consequence of that assessment.

## Why not a multisig

A multisig establishes: **N humans approved this change.**

RootGuard establishes: **validators independently reviewed fetched code against an immutable charter; deterministic gates allowed the result; the challenge period completed; the installed bytes matched the reviewed digest; and the target confirmed installation.**

## Architecture

```text
Protected target owner
  -> protected target enroll_with_rootguard
  -> finalized RootGuard enrollment
  -> maintainer proposal, bound to base version + baseline SHA
  -> validators fetch current and candidate source
  -> structured consensus assessment
  -> deterministic approval gates
  -> one bounded evidence-backed challenge
  -> candidate SHA re-fetch
  -> finalized target.upgrade(bytes)
  -> RootGuard reads target version
  -> EXECUTED only after confirmation
```

## Deterministic vs nondeterministic responsibility

| Responsibility | Type |
| --- | --- |
| Input limits, IDs, HTTPS and commit-pinned URLs | Deterministic |
| Target-owner, steward, and maintainer authorization | Deterministic |
| Target identity and sole RootGuard authority checks | Deterministic |
| Baseline/candidate SHA-256 binding | Deterministic |
| Proposal state machine, concurrency, stale checks | Deterministic |
| Challenge deadline and one-challenge rule | Deterministic |
| Upgrade dispatch and target-version confirmation | Deterministic |
| Fetching public source/evidence | Non-deterministic |
| Interpreting arbitrary source code and charter compliance | Non-deterministic |
| Validator agreement over structured safety findings | GenLayer equivalence principle |

## Security invariants

- A wallet cannot claim stewardship of an arbitrary target: enrollment must originate from the protected target after its owner authorizes that target call.
- A target can have only one active proposal; each proposal is base-version and baseline-SHA bound.
- Stale proposals cannot execute after the RootGuard-managed baseline changes.
- A proposal has exactly one evidence-backed challenge opportunity.
- Malformed consensus results, `LOW` confidence approvals, contradictory fields, or critical risk cannot authorize execution.
- The exact reviewed candidate SHA must match the source RootGuard re-fetches immediately before execution.
- `EXECUTION_QUEUED` does not mean installed: it changes neither RootGuard's current version/source nor `executed_count`.
- Only a real target `get_version()` match during `confirm_execution` records `EXECUTED` and advances RootGuard's authoritative source/version.

## Live StudioNet proof

| Item | Value |
| --- | --- |
| Network | StudioNet |
| Immutable V1/V2 source commit | `54f8c8c6b8fdb4652d5b6c8d823d86009c0e4ebc` |
| RootGuard | `0x37F3bB574128909BD1bbed78343f1622AB07DF4F` |
| Protected target | `0x6aCae084213c59c9FED1d7097001C55FA0E347D6` |
| Candidate SHA-256 | `afebf5fcff029c4cc6ad453af48876213b02238573e2c09653d2ddb76f5c2b35` |
| Final proposal state | `EXECUTED` |
| V1/V2 target address | Same protected target address |
| State proof | V1 counter value survived; V2 `get_version()` returned `v2`; V2-only `add()` executed successfully |

The production `contracts/RootGuard.py` performed this lifecycle. `RootGuardSpike.py` was not used as proof.

| Transaction | Hash |
| --- | --- |
| RootGuard deploy | `0xe686dad7bb265bf25ecb70211d47186986d8937c26885199e55f24aac7169b10` |
| Target deploy | `0xa5a73c129ce7a152f2a7673b0def2a465ad43b213cdaa69bcd42c0b06589a1dc` |
| Secure enrollment | `0x150c7fe5bc5b42e437cf514276d87e71d27e0514f318d6db784876b621d01fee` |
| Proposal submission | `0x4bc1e047c464e2e2f55622a4a6a3a0ba0ff7aa49fbcd4c34e770daf3cc593ff6` |
| Consensus review | `0x21069ef4dda4f2905953e30b3190eeecb9709291a58e920f27a0295cb9cdb924` |
| Execution queue | `0x8f8c69f7e9f34700823f5e72d1cf82a03abcc03a46fa22d9e67efc39fdd9d5ae` |
| Triggered target upgrade | `0x75a4d28cdda333ae8e86cc8d6a0efc306f6cc1e3de48868a603c97813933e955` |
| Confirmation | `0xd8871911bbfb2fa802060303460564d8119508fc2e7bfa3ee8ed0337ce9e2e5b` |

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

Recorded results:

- 45/45 direct contract tests passed.
- 1 full main `RootGuard.py` StudioNet lifecycle passed.
- GenVM lint passed for all production contracts.
- TypeScript passed.
- Next production build passed.
- Schema verification passed against the live RootGuard contract.
- ESLint passed with no errors; it reports one existing PostCSS anonymous-default-export warning.

## Reviewer checklist

- [ ] Open the RootGuard and target addresses in Studio Explorer.
- [ ] Follow the enrollment, proposal, review, execution, child upgrade, and confirmation transactions above.
- [ ] Confirm the candidate digest and terminal `EXECUTED` state through contract reads.
- [ ] Inspect `contracts/RootGuard.py` for deterministic authorization, digest, timing, and confirmation gates.
- [ ] Run the local verification commands.

## Known limitations

- RootGuard is not formal verification and cannot prove arbitrary code is bug-free.
- Source must be publicly fetchable and commit-pinned.
- A target with another independent upgrader can bypass RootGuard; RootGuard therefore requires sole authority for enrolled targets.
- Automated GitHub CI is intentionally absent because the currently available pinned `genlayer-test` Linux runtime references a removed upstream GenVM release artifact. This does not affect the supported local suite or completed StudioNet proof.

Submission packaging is committed on `main`; use the repository commit that contains this document as the exact source snapshot.
