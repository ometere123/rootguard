from pathlib import Path

from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded
from gltest.types import TransactionStatus


CONTRACTS = Path(__file__).parents[2] / "contracts"


def test_rootguard_finalized_message_upgrades_target_and_preserves_state():
    rootguard_factory = get_contract_factory(
        contract_file_path=CONTRACTS / "RootGuardSpike.py"
    )
    v1_factory = get_contract_factory(
        contract_file_path=CONTRACTS / "ProtectedCounterV1.py"
    )
    v2_factory = get_contract_factory(
        contract_file_path=CONTRACTS / "ProtectedCounterV2.py"
    )

    rootguard = rootguard_factory.deploy(args=[], wait_interval=10000, wait_retries=60)
    target_v1 = v1_factory.deploy(
        args=[rootguard.address], wait_interval=10000, wait_retries=60
    )

    first = target_v1.increment(args=[]).transact(wait_interval=10000, wait_retries=60)
    assert tx_execution_succeeded(first), first
    assert target_v1.get_value(args=[]).call() == "1"
    assert target_v1.get_version(args=[]).call() == "v1"

    v2_code = (CONTRACTS / "ProtectedCounterV2.py").read_bytes()
    upgrade = rootguard.execute_upgrade(
        args=[target_v1.address, "v1", v2_code]
    ).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_triggered_transactions=True,
        wait_triggered_transactions_status=TransactionStatus.FINALIZED,
        wait_interval=5000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(upgrade), upgrade
    assert upgrade.get("triggered_transactions"), upgrade

    target_v2 = v2_factory.build_contract(contract_address=target_v1.address)
    assert target_v2.get_value(args=[]).call() == "1"
    assert target_v2.get_version(args=[]).call() == "v2"
    assert target_v2.get_release_marker(args=[]).call() == "ROOTGUARD_UPGRADE_PROVED"

    add = target_v2.add(args=[5]).transact(wait_interval=10000, wait_retries=60)
    assert tx_execution_succeeded(add), add
    assert target_v2.get_value(args=[]).call() == "6"
