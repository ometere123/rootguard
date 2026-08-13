import os
import sys

import pytest


_real_unlink = os.unlink


def _windows_safe_unlink(path, *args, **kwargs):
    try:
        return _real_unlink(path, *args, **kwargs)
    except PermissionError:
        return None


os.unlink = _windows_safe_unlink


COMMIT = "a" * 40
SOURCE_URL = f"https://raw.githubusercontent.com/ometere123/rootguard/{COMMIT}/contracts/ProtectedCounterV1.py"
CANDIDATE_URL = f"https://raw.githubusercontent.com/ometere123/rootguard/{COMMIT}/contracts/ProtectedCounterV2.py"
CHARTER = (
    "Only approve upgrades that preserve the declared storage layout, keep RootGuard as the sole upgrade "
    "authority, retain public reads, avoid value movement, and expose the stated version truthfully."
)
SUMMARY = (
    "Add a bounded counter helper while retaining the existing storage fields in order, RootGuard authority, "
    "public read methods, no value movement, and a truthful target version response."
)


def warp_to(direct_vm, iso: str) -> None:
    direct_vm.warp(iso)
    gl = sys.modules.get("genlayer.gl")
    if gl is None:
        return
    raw = getattr(gl, "message_raw", None)
    if isinstance(raw, dict):
        raw["datetime"] = iso


@pytest.fixture
def rootguard(direct_deploy):
    return direct_deploy("contracts/RootGuard.py", 300)


@pytest.fixture
def target_v1(direct_deploy, direct_bob):
    return direct_deploy("contracts/ProtectedCounterV1.py", direct_bob)


@pytest.fixture
def target_v2(direct_deploy, direct_bob):
    return direct_deploy("contracts/ProtectedCounterV2.py", direct_bob)
