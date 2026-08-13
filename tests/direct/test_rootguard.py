CHARTER = "x" * 160
HTTPS_URL = "https://sources.example/current.py"


def test_constructor_records_challenge_window(rootguard):
    summary = rootguard.get_summary()
    assert summary["challenge_window_seconds"] == "300"
    assert summary["target_count"] == "0"
    assert summary["proposal_count"] == "0"


def test_constructor_rejects_unsafe_short_window(direct_deploy, direct_vm):
    with direct_vm.expect_revert("at least 300"):
        direct_deploy("contracts/RootGuard.py", 299)


def test_target_registration_rejects_non_https_source_before_cross_contract_call(rootguard, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Source URL must use HTTPS"):
        rootguard.register_target(
            "counter-main",
            "Protocol Counter",
            direct_alice,
            CHARTER,
            "http://sources.example/current.py",
        )


def test_target_registration_rejects_short_charter_before_cross_contract_call(rootguard, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("charter length"):
        rootguard.register_target(
            "counter-main",
            "Protocol Counter",
            direct_alice,
            "too short",
            HTTPS_URL,
        )


def test_upgrade_submission_rejects_non_https_candidate_before_target_lookup(rootguard, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Source URL must use HTTPS"):
        rootguard.submit_upgrade(
            "counter-v2",
            "counter-main",
            "http://sources.example/candidate.py",
            "v2",
            "A sufficiently detailed change summary that would otherwise be valid for the upgrade proposal.",
        )


def test_upgrade_submission_rejects_invalid_identifier(rootguard, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("unsupported characters"):
        rootguard.submit_upgrade(
            "counter/v2",
            "counter-main",
            HTTPS_URL,
            "v2",
            "A sufficiently detailed change summary that would otherwise be valid for the upgrade proposal.",
        )


def test_unknown_state_transitions_are_rejected(rootguard, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Unknown proposal"):
        rootguard.review_upgrade("missing-proposal")
    with direct_vm.expect_revert("Unknown proposal"):
        rootguard.open_challenge(
            "missing-proposal",
            HTTPS_URL,
            "A sufficiently detailed public challenge with a durable source and a specific safety concern.",
        )
    with direct_vm.expect_revert("Unknown target"):
        rootguard.deactivate_target("missing-target")


def test_empty_lists_are_paginated_without_error(rootguard):
    assert rootguard.list_targets(0, 50) == []
    assert rootguard.list_proposals("", 0, 50) == []
