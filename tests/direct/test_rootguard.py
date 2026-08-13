from conftest import CANDIDATE_URL, CHARTER, SOURCE_URL, SUMMARY


def test_constructor_records_minimum_window(rootguard):
    summary = rootguard.get_summary()
    assert summary["challenge_window_seconds"] == "300"
    assert summary["target_count"] == "0"
    assert summary["proposal_count"] == "0"


def test_constructor_rejects_short_window(direct_deploy, direct_vm):
    with direct_vm.expect_revert("at least 300"):
        direct_deploy("contracts/RootGuard.py", 299)


def test_constructor_rejects_excessive_window(direct_deploy, direct_vm):
    with direct_vm.expect_revert("seven-day"):
        direct_deploy("contracts/RootGuard.py", 604801)


def test_empty_target_page_is_empty(rootguard):
    assert rootguard.list_targets(0, 50) == []


def test_empty_target_page_caps_limit(rootguard):
    assert rootguard.list_targets(0, 999) == []


def test_empty_proposal_page_is_empty(rootguard):
    assert rootguard.list_proposals("", 0, 50) == []


def test_empty_proposal_page_handles_offset(rootguard):
    assert rootguard.list_proposals("counter-main", 100, 1) == []


def test_unknown_target_read_reverts(rootguard, direct_vm):
    with direct_vm.expect_revert("Unknown target"):
        rootguard.get_target("missing")


def test_unknown_proposal_read_reverts(rootguard, direct_vm):
    with direct_vm.expect_revert("Unknown proposal"):
        rootguard.get_proposal("missing")


def test_unknown_review_reverts(rootguard, direct_vm):
    with direct_vm.expect_revert("Unknown proposal"):
        rootguard.review_upgrade("missing")


def test_unknown_challenge_reverts(rootguard, direct_vm):
    with direct_vm.expect_revert("Unknown proposal"):
        rootguard.open_challenge("missing", SOURCE_URL, "x" * 100)


def test_unknown_execution_reverts(rootguard, direct_vm):
    with direct_vm.expect_revert("Unknown proposal"):
        rootguard.execute_upgrade("missing")


def test_unknown_confirmation_reverts(rootguard, direct_vm):
    with direct_vm.expect_revert("Unknown proposal"):
        rootguard.confirm_execution("missing")


def test_enrollment_rejects_short_target_id(rootguard, direct_alice, direct_vm):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("target id length"):
        rootguard.enroll_target("x", "Protocol Counter", CHARTER, SOURCE_URL)


def test_enrollment_rejects_invalid_target_id(rootguard, direct_alice, direct_vm):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("unsupported characters"):
        rootguard.enroll_target("counter/main", "Protocol Counter", CHARTER, SOURCE_URL)


def test_enrollment_rejects_short_name(rootguard, direct_alice, direct_vm):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("name length"):
        rootguard.enroll_target("counter-main", "x", CHARTER, SOURCE_URL)


def test_enrollment_rejects_short_charter(rootguard, direct_alice, direct_vm):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("charter length"):
        rootguard.enroll_target("counter-main", "Protocol Counter", "short", SOURCE_URL)


def test_enrollment_rejects_non_https_source(rootguard, direct_alice, direct_vm):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("source url must use HTTPS"):
        rootguard.enroll_target("counter-main", "Protocol Counter", CHARTER, "http://example.com/source.py")


def test_enrollment_rejects_mutable_github_source(rootguard, direct_alice, direct_vm):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("commit-pinned"):
        rootguard.enroll_target("counter-main", "Protocol Counter", CHARTER, "https://raw.githubusercontent.com/ometere123/rootguard/main/contracts/ProtectedCounterV1.py")


def test_enrollment_rejects_short_commit_source(rootguard, direct_alice, direct_vm):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("commit-pinned"):
        rootguard.enroll_target("counter-main", "Protocol Counter", CHARTER, "https://raw.githubusercontent.com/ometere123/rootguard/abc/contracts/ProtectedCounterV1.py")


def test_submit_rejects_malformed_proposal_id_before_target_lookup(rootguard, direct_alice, direct_vm):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("unsupported characters"):
        rootguard.submit_upgrade("bad/id", "missing", CANDIDATE_URL, "v2", SUMMARY)


def test_submit_rejects_non_pinned_candidate_before_target_lookup(rootguard, direct_alice, direct_vm):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("commit-pinned"):
        rootguard.submit_upgrade("counter-v2", "missing", "https://raw.githubusercontent.com/ometere123/rootguard/main/contracts/ProtectedCounterV2.py", "v2", SUMMARY)


def test_submit_rejects_short_version_before_target_lookup(rootguard, direct_alice, direct_vm):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("proposed version length"):
        rootguard.submit_upgrade("counter-v2", "missing", CANDIDATE_URL, "", SUMMARY)


def test_submit_rejects_short_summary_before_target_lookup(rootguard, direct_alice, direct_vm):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("change summary length"):
        rootguard.submit_upgrade("counter-v2", "missing", CANDIDATE_URL, "v2", "short")


def test_submit_unknown_target_reverts_after_valid_inputs(rootguard, direct_alice, direct_vm):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Unknown target"):
        rootguard.submit_upgrade("counter-v2", "missing", CANDIDATE_URL, "v2", SUMMARY)


def test_profile_empty_is_truthful(rootguard, direct_alice):
    profile = rootguard.get_profile(direct_alice)
    assert profile["stewarded_targets"] == []
    assert profile["maintained_targets"] == []
    assert profile["submitted_proposals"] == []
