from pathlib import Path

from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded


CONTRACTS = Path(__file__).parents[2] / "contracts"
CHARTER = (
    "Only approve upgrades that preserve storage order, keep RootGuard as the sole upgrader, "
    "retain public reads, avoid new value movement, and expose a truthful version identifier."
)
SUMMARY = (
    "Add a bounded helper without changing existing storage fields, RootGuard authority, public reads, "
    "or introducing value movement. The candidate will expose version v2 truthfully."
)


def test_rootguard_registers_an_authorized_target_and_records_a_maintainer_proposal():
    rootguard_factory = get_contract_factory(contract_file_path=CONTRACTS / "RootGuard.py")
    target_factory = get_contract_factory(contract_file_path=CONTRACTS / "ProtectedCounterV1.py")

    rootguard = rootguard_factory.deploy(args=[300], wait_interval=10000, wait_retries=60)
    target = target_factory.deploy(args=[rootguard.address], wait_interval=10000, wait_retries=60)

    registered = rootguard.register_target(
        args=[
            "counter-main",
            "Protocol Counter",
            target.address,
            CHARTER,
            "https://example.com/rootguard-counter-v1.py",
        ]
    ).transact(wait_interval=10000, wait_retries=60)
    assert tx_execution_succeeded(registered), registered

    submitted = rootguard.submit_upgrade(
        args=[
            "counter-v2",
            "counter-main",
            "https://example.com/rootguard-counter-v2.py",
            "v2",
            SUMMARY,
        ]
    ).transact(wait_interval=10000, wait_retries=60)
    assert tx_execution_succeeded(submitted), submitted

    stored_target = rootguard.get_target(args=["counter-main"]).call()
    stored_proposal = rootguard.get_proposal(args=["counter-v2"]).call()
    assert stored_target["contract_address"].lower() == target.address.lower()
    assert stored_target["current_version"] == "v1"
    assert stored_proposal["status"] == "AWAITING_REVIEW"
    assert stored_proposal["proposed_version"] == "v2"
