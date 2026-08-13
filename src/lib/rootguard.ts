"use client";

import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import type { CalldataEncodable, TransactionHash } from "genlayer-js/types";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ROOTGUARD_CONTRACT as `0x${string}` | undefined;
const endpoint = process.env.NEXT_PUBLIC_GENLAYER_ENDPOINT ?? "https://studio.genlayer.com/api";
const explorer = "https://explorer-studio.genlayer.com";

export type Summary = Record<string, string>;
export type Target = Record<string, string | boolean>;
export type Proposal = Record<string, string>;

export const txUrl = (hash: string) => `${explorer}/tx/${hash}`;
export const addressUrl = (address: string) => `${explorer}/address/${address}`;

function readClient() {
  return createClient({ chain: studionet, endpoint });
}

export async function readContract<T>(functionName: string, args: CalldataEncodable[] = []): Promise<T | undefined> {
  if (!CONTRACT_ADDRESS) return undefined;
  try {
    return await readClient().readContract({ address: CONTRACT_ADDRESS, functionName, args }) as T;
  } catch {
    return undefined;
  }
}

export async function loadLedger() {
  const [summary, targets, proposals] = await Promise.all([
    readContract<Summary>("get_summary"),
    readContract<Target[]>("list_targets", [0n, 50n]),
    readContract<Proposal[]>("list_proposals", ["", 0n, 100n]),
  ]);
  return { summary, targets: targets ?? [], proposals: proposals ?? [] };
}

export async function writeRootGuard(
  privateKey: `0x${string}` | undefined,
  injectedAddress: `0x${string}` | undefined,
  functionName: string,
  args: CalldataEncodable[],
) {
  if (!CONTRACT_ADDRESS) throw new Error("Set NEXT_PUBLIC_ROOTGUARD_CONTRACT before sending a transaction.");
  const provider = typeof window !== "undefined" ? window.ethereum : undefined;
  const account = privateKey ? createAccount(privateKey) : injectedAddress;
  if (!account) throw new Error("Connect a wallet before sending a transaction.");
  const client = createClient({ chain: studionet, endpoint, account, provider });
  await client.connect("studionet");
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    value: 0n,
    consensusMaxRotations: 3,
  }) as TransactionHash;
  return hash;
}

export async function waitFinalized(privateKey: `0x${string}` | undefined, injectedAddress: `0x${string}` | undefined, hash: TransactionHash) {
  const provider = typeof window !== "undefined" ? window.ethereum : undefined;
  const account = privateKey ? createAccount(privateKey) : injectedAddress;
  if (!account) throw new Error("Wallet connection is unavailable.");
  const client = createClient({ chain: studionet, endpoint, account, provider });
  await client.connect("studionet");
  const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 5000, retries: 90 });
  const transaction = await client.getTransaction({ hash });
  const result = transaction?.consensus_data?.leader_receipt?.[0]?.execution_result;
  if (result && result !== "SUCCESS") throw new Error(`Contract execution failed (${result}).`);
  return receipt;
}

declare global {
  interface Window {
    ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  }
}
