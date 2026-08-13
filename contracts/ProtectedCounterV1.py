# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class ProtectedCounter(gl.Contract):
    value: u256
    version: str
    rootguard: Address

    def __init__(self, rootguard: Address):
        controller = rootguard if isinstance(rootguard, Address) else Address(rootguard)
        self.value = u256(0)
        self.version = "v1"
        self.rootguard = controller

        root = gl.storage.Root.get()
        root.upgraders.get().append(controller)

    @gl.public.write
    def increment(self) -> None:
        self.value += u256(1)

    @gl.public.write
    def upgrade(self, new_code: bytes) -> None:
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
