# RootGuard Submission Evidence

## Product

RootGuard is a GenLayer-native upgrade authority that replaces protected contract code only after independent source review, deterministic safety gates, a bounded evidence challenge, byte-level binding, and post-installation confirmation.

## Problem and GenLayer necessity

Admin-key upgrades ask users to trust whoever controls the key to understand and safely install arbitrary code. A multisig proves several people approved; a backend or LLM API simply centralizes the semantic review oracle. Deterministic contract logic cannot decide whether arbitrary source preserves storage, authority, permissions, value handling, or a natural-language charter.

GenLayer validators independently fetch and judge that semantic evidence. RootGuard’s deterministic code alone controls roles, timing, state transitions, SHA checks, dispatch, and final confirmation.

## Architecture

```text
Target owner -> protected target enrollment -> RootGuard registry
Maintainer -> commit-pinned candidate -> custom validator review
Approved -> one evidence snapshot challenge -> SHA re-check
RootGuard -> finalized upgrade(bytes) -> protected target
protected target version -> RootGuard confirm_execution -> EXECUTED
```

| Responsibility | Type |
| --- | --- |
| Roles, source URL rules, state machine, challenge/retry timing, SHA-256 | Deterministic |
| Public source/evidence fetch and code interpretation | Non-deterministic |
| Security-field agreement | Custom `gl.vm.run_nondet_unsafe` validator |
| Consequences of approval and installed-version truth | Deterministic |

## Security invariants

- Only a protected target’s owner-authorized finalized message can enroll it; direct wallet registration cannot seize stewardship.
- RootGuard requires the target to declare RootGuard as its sole native upgrade authority.
- Baseline and candidate source use commit-pinned GitHub raw URLs. A candidate is fetched and hashed before it occupies the target; submission, review, and execution bytes must match.
- Validators independently derive and programmatically compare verdict, confidence, storage compatibility, authority preservation, value movement, external calls, charter compliance, and critical risk. Prose cannot authorize execution.
- Challenge evidence is fetched, bounded, snapshotted, and hashed before `CHALLENGED`; unavailable evidence cannot lock a proposal.
- One challenge is allowed. Stewards may cancel only before any upgrade message is emitted.
- Queued execution is never blindly cancelled. A bounded retry reads target version, hash-checks the exact candidate, and only re-emits from the known base version.
- `EXECUTED` and authoritative target source/version change only after a real target `get_version()` confirmation.

## Live hardened StudioNet proof

| Item | Value |
| --- | --- |
| RootGuard | [`0x254788abEDf36c8e88861f49Bd92047361c52d8C`](https://explorer-studio.genlayer.com/address/0x254788abEDf36c8e88861f49Bd92047361c52d8C) |
| Protected target | [`0xe86D87e5303eFb668A44224EdA24997B36eB4130`](https://explorer-studio.genlayer.com/address/0xe86D87e5303eFb668A44224EdA24997B36eB4130) |
| Source commit | `e499c086113ce76aaeae9218efb9691cdd6dab01` |
| V1 source | `https://raw.githubusercontent.com/ometere123/rootguard/e499c086113ce76aaeae9218efb9691cdd6dab01/contracts/ProtectedCounterV1.py` |
| V2 source | `https://raw.githubusercontent.com/ometere123/rootguard/e499c086113ce76aaeae9218efb9691cdd6dab01/contracts/ProtectedCounterV2.py` |
| Baseline SHA | `11f785a9fc253a9e91b28c2338985c2f3f76422ff2eb700acd65f69afffce36e` |
| Candidate SHA | `afebf5fcff029c4cc6ad453af48876213b02238573e2c09653d2ddb76f5c2b35` |
| Final state | `counter-v2`: `EXECUTED` |

The production `RootGuard.py` lifecycle installed V2 at the same target address, preserved V1 counter state, exercised V2-only `add()`, and advanced RootGuard’s authoritative source/version only on confirmation.

| Proof | Transaction |
| --- | --- |
| RootGuard deploy | `0x03d584f2e90fa62642c5e9b48956809e192e2c16afaa199e4a75ca8f7b7efa3b` |
| Target deploy | `0x4154565271456dcc11156979a1e5af04146555be939cd8405cb331547fbaea45` |
| Enrollment | `0xadd5acd30995aa08716b470b55e44e9c5a54f8a16f3480b52f7cb3a57584477a` |
| Bad candidate preflight | `0x6aea6ee3d3acc57ad8344d710d7425e087999f1465e23c4697413eeafb649ef4` |
| Proposal | `0xf21dca65f67b79c1cb4351cc28c5411c5ffdefd9cd4d43091f2929acf5837d3b` |
| Consensus review | `0xf4011ca711dd60cb64526281851ba038f3d79e6f4fc921e3a038e49ad76ff946` |
| Bad challenge preflight | `0x98a570c2851d23f258c9cd4f3716273537ccac56c4b6169716db87fae1269662` |
| Execution / child | `0xa8a6ff7e1791aa1f3ab04a68798e11a8d49e78f55f14d28a375b22217edabdef` / `0x08de2fa022997e85c7068f7bd1ccf451c9fb7c8f7b63b3c418b5c560e9cae4c8` |
| Confirmation | `0x8d55b51c90af9508c26dc2677ec1751d5e9135b4ddc208e8fa8aeb97bef74765` |

## Reproduction and verification

```powershell
python -m pytest tests\direct -v
$env:PYTHONIOENCODING = "utf-8"
& "C:\Users\USER\AppData\Local\Python\pythoncore-3.14-64\Scripts\genvm-lint.exe" check contracts\RootGuard.py
& "C:\Users\USER\AppData\Local\Python\pythoncore-3.14-64\Scripts\gltest.exe" tests\integration\test_rootguard_controller.py -v -s
npm run lint
npx tsc --noEmit
npm run build
npm run verify:schema
```

Results: 45 direct tests passed; 1 full hardened StudioNet lifecycle with two adverse preflight checks passed; GenVM lint passed; TypeScript passed; production build passed; schema verification against the live contract passes; ESLint has no errors and one existing PostCSS style warning.

## Reviewer checklist

- [ ] Open the RootGuard and protected target addresses in Studio Explorer.
- [ ] Inspect commit-pinned V1/V2 source and recorded SHA values.
- [ ] Run the direct suite, lint, and schema script.
- [ ] Run the StudioNet lifecycle test to observe secure enrollment, preflight failures without locks, consensus review, finalized child upgrade, and confirmation.
- [ ] Verify the Vercel console reads the displayed live address and has no fabricated fallback data.

## Known limitations

RootGuard is not formal verification and does not cryptographically prove arbitrary deployed target bytes match an offered source URL without a native code-attestation primitive. It protects only targets that grant it sole native authority. GitHub Actions is intentionally absent: the pinned Linux `genlayer-test` bootstrap references a removed upstream GenVM artifact; reproducible local verification and StudioNet proof are the project’s supported evidence model.
