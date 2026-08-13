import hashlib
import json
import time
from pathlib import Path

from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded
from gltest.types import TransactionStatus
from gltest.utils import extract_contract_address


CONTRACTS = Path(__file__).parents[2] / "contracts"
COMMIT = "e499c086113ce76aaeae9218efb9691cdd6dab01"
V1_URL = f"https://raw.githubusercontent.com/ometere123/rootguard/{COMMIT}/contracts/ProtectedCounterV1.py"
V2_URL = f"https://raw.githubusercontent.com/ometere123/rootguard/{COMMIT}/contracts/ProtectedCounterV2.py"
CHARTER = (
    "Only approve upgrades that preserve the declared storage layout, keep RootGuard as the sole upgrade "
    "authority, retain public reads, avoid value movement, and expose the stated version truthfully."
)
SUMMARY = (
    "Add a bounded counter helper while retaining the existing storage fields in order, RootGuard authority, "
    "public read methods, no value movement, and a truthful target version response."
)


def _hash(receipt):
    return str(receipt.get("hash") or receipt.get("transaction_hash") or receipt.get("tx_hash") or receipt.get("tx_id") or "UNKNOWN")


def _record(label, receipt):
    print(f"ROOTGUARD_EVIDENCE {label}={_hash(receipt)}")
    print(
        "ROOTGUARD_RECEIPT "
        + json.dumps(
            {
                "label": label,
                "result_name": receipt.get("result_name"),
                "execution_result": receipt.get("execution_result"),
                "triggered_transactions": receipt.get("triggered_transactions", []),
            },
            default=str,
            sort_keys=True,
        )
    )


def _deploy(factory, args):
    receipt = factory.deploy_contract_tx(
        args=args,
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=5000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(receipt), receipt
    return factory.build_contract(contract_address=extract_contract_address(receipt)), receipt


def test_main_rootguard_full_finalized_upgrade_lifecycle_on_studionet():
    rootguard_factory = get_contract_factory(contract_file_path=CONTRACTS / "RootGuard.py")
    v1_factory = get_contract_factory(contract_file_path=CONTRACTS / "ProtectedCounterV1.py")
    v2_factory = get_contract_factory(contract_file_path=CONTRACTS / "ProtectedCounterV2.py")

    rootguard, rootguard_deploy = _deploy(rootguard_factory, [300])
    _record("ROOTGUARD_DEPLOY", rootguard_deploy)
    target_v1, target_deploy = _deploy(v1_factory, [rootguard.address])
    _record("TARGET_DEPLOY", target_deploy)
    print(f"ROOTGUARD_EVIDENCE ROOTGUARD_ADDRESS={rootguard.address}")
    print(f"ROOTGUARD_EVIDENCE TARGET_ADDRESS={target_v1.address}")
    print(f"ROOTGUARD_EVIDENCE COMMIT={COMMIT}")
    print(f"ROOTGUARD_EVIDENCE V1_URL={V1_URL}")
    print(f"ROOTGUARD_EVIDENCE V2_URL={V2_URL}")

    increment = target_v1.increment(args=[]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED, wait_interval=5000, wait_retries=180
    )
    assert tx_execution_succeeded(increment), increment
    _record("V1_INCREMENT", increment)
    assert target_v1.get_value(args=[]).call() == "1"
    assert target_v1.get_version(args=[]).call() == "v1"
    assert target_v1.has_sole_rootguard_authority(args=[]).call() is True

    enrollment = target_v1.enroll_with_rootguard(args=["counter-main", "RootGuard Counter", CHARTER, V1_URL]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_triggered_transactions=True,
        wait_triggered_transactions_status=TransactionStatus.FINALIZED,
        wait_interval=5000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(enrollment), enrollment
    assert enrollment.get("triggered_transactions"), enrollment
    _record("ENROLLMENT_PARENT", enrollment)
    print(f"ROOTGUARD_EVIDENCE ENROLLMENT_CHILD={enrollment['triggered_transactions'][0]}")

    target = rootguard.get_target(args=["counter-main"]).call()
    assert target["contract_address"].lower() == target_v1.address.lower()
    assert target["current_version"] == "v1"
    assert target["current_source_url"] == V1_URL
    assert target["current_source_sha256"] == hashlib.sha256((CONTRACTS / "ProtectedCounterV1.py").read_bytes()).hexdigest()
    assert target["sole_rootguard_authority"] is True

    # A syntactically valid but nonexistent commit-pinned candidate must fail
    # before RootGuard records any proposal or occupies this target.
    bad_candidate = f"https://raw.githubusercontent.com/ometere123/rootguard/{COMMIT}/contracts/DoesNotExist.py"
    bad_candidate_tx = rootguard.submit_upgrade(args=["missing-v2", "counter-main", bad_candidate, "v2", SUMMARY]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED, wait_interval=5000, wait_retries=180
    )
    assert not tx_execution_succeeded(bad_candidate_tx), bad_candidate_tx
    _record("ADVERSE_CANDIDATE_PREFLIGHT", bad_candidate_tx)
    after_bad_candidate = rootguard.get_target(args=["counter-main"]).call()
    assert after_bad_candidate["active_proposal_id"] == ""
    assert after_bad_candidate["proposal_count"] == "0"

    proposal_tx = rootguard.submit_upgrade(args=["counter-v2", "counter-main", V2_URL, "v2", SUMMARY]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED, wait_interval=5000, wait_retries=180
    )
    assert tx_execution_succeeded(proposal_tx), proposal_tx
    _record("PROPOSAL", proposal_tx)
    submitted = rootguard.get_proposal(args=["counter-v2"]).call()
    assert submitted["base_version"] == "v1"
    assert submitted["base_source_sha256"] == target["current_source_sha256"]

    review_tx = rootguard.review_upgrade(args=["counter-v2"]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED, wait_interval=5000, wait_retries=240
    )
    assert tx_execution_succeeded(review_tx), review_tx
    _record("REVIEW", review_tx)
    reviewed = rootguard.get_proposal(args=["counter-v2"]).call()
    print(f"ROOTGUARD_EVIDENCE REVIEW_VERDICT={reviewed['verdict']}")
    print(f"ROOTGUARD_EVIDENCE CANDIDATE_SHA256={reviewed['candidate_sha256']}")
    assert reviewed["status"] == "APPROVED_CHALLENGE_WINDOW", reviewed
    assert reviewed["candidate_sha256"] == hashlib.sha256((CONTRACTS / "ProtectedCounterV2.py").read_bytes()).hexdigest()
    assert reviewed["storage_compatible"] is True
    assert reviewed["upgrade_authority_preserved"] is True
    assert reviewed["value_movement_safe"] is True
    assert reviewed["external_calls_safe"] is True
    assert reviewed["charter_compliant"] is True
    assert reviewed["critical_risk"] is False

    # Invalid evidence cannot consume the one challenge or leave the proposal
    # stuck in CHALLENGED because RootGuard fetches before changing state.
    bad_challenge = f"https://raw.githubusercontent.com/ometere123/rootguard/{COMMIT}/contracts/NoChallengeEvidence.txt"
    bad_challenge_tx = rootguard.open_challenge(args=["counter-v2", bad_challenge, "This evidence path is deliberately absent to prove preflight liveness without changing proposal state."]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED, wait_interval=5000, wait_retries=180
    )
    assert not tx_execution_succeeded(bad_challenge_tx), bad_challenge_tx
    _record("ADVERSE_CHALLENGE_PREFLIGHT", bad_challenge_tx)
    after_bad_challenge = rootguard.get_proposal(args=["counter-v2"]).call()
    assert after_bad_challenge["status"] == "APPROVED_CHALLENGE_WINDOW"
    assert after_bad_challenge["challenge_used"] is False

    # The production contract floor is five minutes. Wait for its on-chain deadline rather than weakening it.
    while True:
        now = int(time.time())
        deadline = int(__import__("datetime").datetime.fromisoformat(reviewed["challenge_deadline"].replace("Z", "+00:00")).timestamp())
        if now >= deadline + 2:
            break
        time.sleep(min(15, deadline + 2 - now))

    queued_tx = rootguard.execute_upgrade(args=["counter-v2"]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_triggered_transactions=True,
        wait_triggered_transactions_status=TransactionStatus.FINALIZED,
        wait_interval=5000,
        wait_retries=240,
    )
    assert tx_execution_succeeded(queued_tx), queued_tx
    assert queued_tx.get("triggered_transactions"), queued_tx
    _record("EXECUTION", queued_tx)
    print(f"ROOTGUARD_EVIDENCE TRIGGERED_UPGRADE={queued_tx['triggered_transactions'][0]}")

    queued = rootguard.get_proposal(args=["counter-v2"]).call()
    before_confirm = rootguard.get_target(args=["counter-main"]).call()
    assert queued["status"] == "EXECUTION_QUEUED"
    assert before_confirm["current_version"] == "v1"
    assert before_confirm["current_source_url"] == V1_URL
    assert rootguard.get_summary(args=[]).call()["executed_count"] == "0"

    target_v2 = v2_factory.build_contract(contract_address=target_v1.address)
    assert target_v2.get_value(args=[]).call() == "1"
    assert target_v2.get_version(args=[]).call() == "v2"
    assert target_v2.get_release_marker(args=[]).call() == "ROOTGUARD_V2_CONFIRMED"
    add = target_v2.add(args=[5]).transact(wait_transaction_status=TransactionStatus.FINALIZED, wait_interval=5000, wait_retries=180)
    assert tx_execution_succeeded(add), add
    _record("V2_ADD", add)
    assert target_v2.get_value(args=[]).call() == "6"

    confirmation_tx = rootguard.confirm_execution(args=["counter-v2"]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED, wait_interval=5000, wait_retries=180
    )
    assert tx_execution_succeeded(confirmation_tx), confirmation_tx
    _record("CONFIRMATION", confirmation_tx)
    final_proposal = rootguard.get_proposal(args=["counter-v2"]).call()
    final_target = rootguard.get_target(args=["counter-main"]).call()
    assert final_proposal["status"] == "EXECUTED"
    assert final_target["current_version"] == "v2"
    assert final_target["current_source_url"] == V2_URL
    assert final_target["current_source_sha256"] == reviewed["candidate_sha256"]
    assert rootguard.get_summary(args=[]).call()["executed_count"] == "1"
