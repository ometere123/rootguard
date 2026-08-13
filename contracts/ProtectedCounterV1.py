# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


@gl.contract_interface
class RootGuardEnrollment:
    class Write:
        def enroll_target(self, target_id: str, name: str, charter: str, current_source_url: str) -> None: ...


class ProtectedCounter(gl.Contract):
    owner: Address
    rootguard: Address
    value: u256
    version: str

    def __init__(self, rootguard: Address):
        controller = rootguard if isinstance(rootguard, Address) else Address(rootguard)
        self.owner = gl.message.sender_address
        self.rootguard = controller
        self.value = u256(0)
        self.version = "v1"
        root = gl.storage.Root.get()
        root.upgraders.get().append(controller)

    @gl.public.write
    def enroll_with_rootguard(self, target_id: str, name: str, charter: str, current_source_url: str) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("[EXPECTED] Only the protected target owner may request RootGuard enrollment")
        RootGuardEnrollment(self.rootguard).emit(on="finalized").enroll_target(target_id, name, charter, current_source_url)

    @gl.public.write
    def increment(self) -> None:
        self.value += u256(1)

    @gl.public.write
    def upgrade(self, new_code: bytes) -> None:
        if gl.message.sender_address != self.rootguard:
            raise gl.vm.UserError("[EXPECTED] Only RootGuard may upgrade this protected target")
        code = gl.storage.Root.get().code.get()
        code.truncate()
        code.extend(new_code)

    @gl.public.view
    def get_value(self) -> str:
        return str(self.value)

    @gl.public.view
    def get_version(self) -> str:
        return self.version

    @gl.public.view
    def get_rootguard(self) -> str:
        return str(self.rootguard)

    @gl.public.view
    def get_owner(self) -> str:
        return str(self.owner)

    @gl.public.view
    def has_sole_rootguard_authority(self) -> bool:
        upgraders = gl.storage.Root.get().upgraders.get()
        return len(upgraders) == 1 and upgraders[0] == self.rootguard
