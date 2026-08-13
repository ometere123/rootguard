import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const address = process.env.NEXT_PUBLIC_ROOTGUARD_CONTRACT;
const endpoint = process.env.NEXT_PUBLIC_GENLAYER_ENDPOINT ?? "https://studio.genlayer.com/api";
const required = [
  "register_target", "set_maintainer", "submit_upgrade", "review_upgrade", "open_challenge",
  "review_challenge", "execute_upgrade", "confirm_execution", "deactivate_target", "get_summary",
  "get_target", "get_proposal", "list_targets", "list_proposals", "get_profile",
];

if (!address || /^0x0{40}$/i.test(address)) {
  console.error("Set NEXT_PUBLIC_ROOTGUARD_CONTRACT to a deployed RootGuard address before schema verification.");
  process.exit(1);
}

const client = createClient({ chain: studionet, endpoint });
const schema = await client.getContractSchema(address);
const missing = required.filter((method) => !schema.methods[method]);
if (missing.length) {
  console.error(`RootGuard schema is missing: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`RootGuard schema verified: ${required.length} methods present.`);
