# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


@gl.contract_interface
class UpgradableTarget:
    class View:
        def get_version(self) -> str: ...

    class Write:
        def upgrade(self, new_code: bytes) -> None: ...


class RootGuardSpike(gl.Contract):
    owner: Address
    execution_count: u256
    last_target: Address

    def __init__(self):
        self.owner = gl.message.sender_address
        self.execution_count = u256(0)
        self.last_target = Address(b"\x00" * Address.SIZE)

    @gl.public.write
    def execute_upgrade(self, target: Address, expected_version: str, new_code: bytes) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("[EXPECTED] Only the RootGuard owner may run the spike")
        if len(new_code) == 0:
            raise gl.vm.UserError("[EXPECTED] Upgrade code is required")

        target_address = target if isinstance(target, Address) else Address(target)
        current_version = UpgradableTarget(target_address).view().get_version()
        if current_version != expected_version:
            raise gl.vm.UserError("[EXPECTED] Target version changed")

        self.execution_count += u256(1)
        self.last_target = target_address
        UpgradableTarget(target_address).emit(on="finalized").upgrade(new_code)

    @gl.public.view
    def get_state(self) -> dict:
        return {
            "owner": str(self.owner),
            "execution_count": str(self.execution_count),
            "last_target": str(self.last_target),
        }
