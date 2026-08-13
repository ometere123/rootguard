from conftest import CHARTER, SOURCE_URL


def test_v1_records_rootguard(target_v1, direct_bob):
    assert target_v1.get_rootguard().lower() == "0x" + direct_bob.hex()


def test_v1_records_deployer_as_owner(target_v1, direct_owner):
    assert target_v1.get_owner() == str(direct_owner)


def test_v1_exposes_v1(target_v1):
    assert target_v1.get_version() == "v1"


def test_v1_starts_at_zero(target_v1):
    assert target_v1.get_value() == "0"


def test_v1_increment_updates_value(target_v1, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    target_v1.increment()
    assert target_v1.get_value() == "1"


def test_v1_allows_multiple_public_increments(target_v1, direct_vm, direct_alice, direct_charlie):
    direct_vm.sender = direct_alice
    target_v1.increment()
    direct_vm.sender = direct_charlie
    target_v1.increment()
    assert target_v1.get_value() == "2"


def test_v1_reports_sole_rootguard_authority(target_v1):
    assert target_v1.has_sole_rootguard_authority() is True


def test_v1_rejects_non_owner_enrollment(target_v1, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Only the protected target owner"):
        target_v1.enroll_with_rootguard("counter-main", "Protocol Counter", CHARTER, SOURCE_URL)


def test_v1_rejects_non_rootguard_upgrade(target_v1, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Only RootGuard"):
        target_v1.upgrade(b"not-authorized")


def test_v2_records_rootguard(target_v2, direct_bob):
    assert target_v2.get_rootguard().lower() == "0x" + direct_bob.hex()


def test_v2_records_deployer_as_owner(target_v2, direct_owner):
    assert target_v2.get_owner() == str(direct_owner)


def test_v2_exposes_v2(target_v2):
    assert target_v2.get_version() == "v2"


def test_v2_starts_with_compatible_storage(target_v2):
    assert target_v2.get_value() == "0"


def test_v2_add_updates_value(target_v2, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    target_v2.add(7)
    assert target_v2.get_value() == "7"


def test_v2_increment_and_add_compose(target_v2, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    target_v2.increment()
    target_v2.add(4)
    assert target_v2.get_value() == "5"


def test_v2_reports_sole_rootguard_authority(target_v2):
    assert target_v2.has_sole_rootguard_authority() is True


def test_v2_exposes_release_marker(target_v2):
    assert target_v2.get_release_marker() == "ROOTGUARD_V2_CONFIRMED"


def test_v2_rejects_non_owner_enrollment(target_v2, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Only the protected target owner"):
        target_v2.enroll_with_rootguard("counter-main", "Protocol Counter", CHARTER, SOURCE_URL)


def test_v2_rejects_non_rootguard_upgrade(target_v2, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Only RootGuard"):
        target_v2.upgrade(b"not-authorized")
