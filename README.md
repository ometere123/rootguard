# RootGuard

RootGuard is a GenLayer-native upgrade authority: a protected intelligent contract installs commit-pinned code only after independent validator review, deterministic safety gates, a bounded challenge path, exact byte binding, and confirmed installation.

**Production console:** https://rootguard.vercel.app  
**Hardened StudioNet RootGuard:** [`0x254788abEDf36c8e88861f49Bd92047361c52d8C`](https://explorer-studio.genlayer.com/address/0x254788abEDf36c8e88861f49Bd92047361c52d8C)

## Why RootGuard

An administrator key can normally replace an upgradeable contract immediately. A multisig answers whether several people approved; it cannot independently determine whether arbitrary code preserves storage, authority, permissions, and a safety charter. A deterministic contract can bind bytes and enforce a state machine, but cannot semantically review code. An off-chain LLM merely becomes another trusted reviewer.

RootGuard makes GenLayer validators independently inspect immutable public source, then lets deterministic code control every consequence.

```text
Target owner -> target-controlled enrollment -> RootGuard
maintainer -> commit-pinned candidate -> independent security review
approved -> one bounded challenge -> SHA re-fetch -> finalized target.upgrade(bytes)
target get_version() -> RootGuard confirmation -> EXECUTED
```

## Security and liveness model

- **Target-controlled enrollment:** only the protected target can send finalized enrollment after its stored owner authorizes it. RootGuard verifies its declared controller and sole native RootGuard authority. Arbitrary wallets cannot claim stewardship.
- **Baseline review:** enrollment strictly fetches and hashes the baseline, then validators inspect whether the source visibly uses Root Slot authority, restricts enrollment to the owner, and exposes no obvious alternate upgrade path. This is a semantic source review, not a cryptographic proof that arbitrary deployed bytes equal a supplied URL.
- **Immutable inputs:** baseline and candidates require 40-character commit-pinned GitHub raw URLs. Candidate bytes are fetched before a proposal can occupy a target, then must match at submission, review, and execution.
- **Custom consensus validator:** each validator independently reruns the security assessment through `gl.vm.run_nondet_unsafe` and programmatically compares verdict, confidence, storage compatibility, authority preservation, value movement, external calls, charter compliance, and critical risk. Rationale and risk-flag prose are non-authorizing.
- **Fail closed:** malformed, low-confidence, or contradictory analysis cannot authorize execution. Fetched code and evidence are explicitly treated as untrusted evidence, never instructions.
- **One bounded challenge:** RootGuard fetches, bounds, snapshots, and hashes challenge evidence *before* recording `CHALLENGED`; a dead URL therefore cannot lock governance. The single-use flag prevents replayed challenges.
- **Safe exits:** the steward may cancel only pre-execution proposals. `EXECUTION_QUEUED` remains occupied because a finalized child can still execute; after a bounded delay, `retry_execution` reads actual target version, finalizes if already installed, retries only from the base version with the same SHA-bound bytes, and fails closed on unexpected versions.
- **Truthful execution:** queueing never advances installed source/version or `executed_count`. Only `confirm_execution`, after a live `get_version()` check, records `EXECUTED`.

## Responsibility boundary

| Responsibility | Type |
| --- | --- |
| URL/input validation, roles, state transitions, windows, SHA-256, retries | Deterministic |
| Fetching public source/evidence and understanding code semantics | Non-deterministic |
| Independent validator agreement on authorization-critical fields | Custom equivalence principle |
| Upgrade dispatch and real target-version confirmation | Deterministic contract-to-contract flow |

## Hardened StudioNet proof

The real `contracts/RootGuard.py` completed V1 to V2 at the **same** protected target address. V1 counter storage survived; V2 reported `v2`; V2-only `add()` worked; RootGuard advanced its authoritative source/version only after confirmation.

| Evidence | Value |
| --- | --- |
| RootGuard | [`0x254788abEDf36c8e88861f49Bd92047361c52d8C`](https://explorer-studio.genlayer.com/address/0x254788abEDf36c8e88861f49Bd92047361c52d8C) |
| Protected target | [`0xe86D87e5303eFb668A44224EdA24997B36eB4130`](https://explorer-studio.genlayer.com/address/0xe86D87e5303eFb668A44224EdA24997B36eB4130) |
| Sources | commit [`e499c086113ce76aaeae9218efb9691cdd6dab01`](https://github.com/ometere123/rootguard/commit/e499c086113ce76aaeae9218efb9691cdd6dab01) |
| Baseline SHA | `11f785a9fc253a9e91b28c2338985c2f3f76422ff2eb700acd65f69afffce36e` |
| Candidate SHA | `afebf5fcff029c4cc6ad453af48876213b02238573e2c09653d2ddb76f5c2b35` |
| Final proposal | `counter-v2` -> `EXECUTED` |

| Transaction | Hash |
| --- | --- |
| RootGuard deploy | [`0x03d584f2e90fa62642c5e9b48956809e192e2c16afaa199e4a75ca8f7b7efa3b`](https://explorer-studio.genlayer.com/tx/0x03d584f2e90fa62642c5e9b48956809e192e2c16afaa199e4a75ca8f7b7efa3b) |
| Target deploy | [`0x4154565271456dcc11156979a1e5af04146555be939cd8405cb331547fbaea45`](https://explorer-studio.genlayer.com/tx/0x4154565271456dcc11156979a1e5af04146555be939cd8405cb331547fbaea45) |
| Enrollment | [`0xadd5acd30995aa08716b470b55e44e9c5a54f8a16f3480b52f7cb3a57584477a`](https://explorer-studio.genlayer.com/tx/0xadd5acd30995aa08716b470b55e44e9c5a54f8a16f3480b52f7cb3a57584477a) |
| Candidate preflight adverse proof | [`0x6aea6ee3d3acc57ad8344d710d7425e087999f1465e23c4697413eeafb649ef4`](https://explorer-studio.genlayer.com/tx/0x6aea6ee3d3acc57ad8344d710d7425e087999f1465e23c4697413eeafb649ef4) |
| Proposal / review | [`0xf21dca65f67b79c1cb4351cc28c5411c5ffdefd9cd4d43091f2929acf5837d3b`](https://explorer-studio.genlayer.com/tx/0xf21dca65f67b79c1cb4351cc28c5411c5ffdefd9cd4d43091f2929acf5837d3b) / [`0xf4011ca711dd60cb64526281851ba038f3d79e6f4fc921e3a038e49ad76ff946`](https://explorer-studio.genlayer.com/tx/0xf4011ca711dd60cb64526281851ba038f3d79e6f4fc921e3a038e49ad76ff946) |
| Challenge preflight adverse proof | [`0x98a570c2851d23f258c9cd4f3716273537ccac56c4b6169716db87fae1269662`](https://explorer-studio.genlayer.com/tx/0x98a570c2851d23f258c9cd4f3716273537ccac56c4b6169716db87fae1269662) |
| Execution / child | [`0xa8a6ff7e1791aa1f3ab04a68798e11a8d49e78f55f14d28a375b22217edabdef`](https://explorer-studio.genlayer.com/tx/0xa8a6ff7e1791aa1f3ab04a68798e11a8d49e78f55f14d28a375b22217edabdef) / [`0x08de2fa022997e85c7068f7bd1ccf451c9fb7c8f7b63b3c418b5c560e9cae4c8`](https://explorer-studio.genlayer.com/tx/0x08de2fa022997e85c7068f7bd1ccf451c9fb7c8f7b63b3c418b5c560e9cae4c8) |
| Confirmation | [`0x8d55b51c90af9508c26dc2677ec1751d5e9135b4ddc208e8fa8aeb97bef74765`](https://explorer-studio.genlayer.com/tx/0x8d55b51c90af9508c26dc2677ec1751d5e9135b4ddc208e8fa8aeb97bef74765) |

## Frontend and verification

The Next.js console uses injected wallets only, reads live StudioNet state, waits for finality, validates execution results, and surfaces child transaction links. It has no backend, private-key wallet, fake fallback data, or fabricated status.

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

Local proof: 45 direct tests passed; the full hardened StudioNet lifecycle plus adverse preflight checks passed; lint passed for RootGuard and both protected targets; TypeScript, production build, and live schema verification pass. ESLint has no errors and one existing PostCSS style warning. No GitHub Actions workflow is used because the pinned Linux `genlayer-test` bootstrap references a removed upstream GenVM artifact.

## Limits

RootGuard is not formal verification. It requires public commit-pinned source and sole RootGuard native authority. It cannot cryptographically attest arbitrary deployed code against a supplied source URL without a native code-attestation primitive.
