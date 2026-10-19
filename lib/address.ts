/** Address helpers shared by client and server. */
export type AddressLike = {
  house_no: string;
  street?: string | null;
  block: string;
  phase: string;
};

/** "House 142, Street 5, Y Block, Phase 3" */
export function formatAddress(a: AddressLike): string {
  const block = /^[A-Z]{1,3}$/i.test(a.block) ? `${a.block} Block` : a.block;
  return [`House ${a.house_no}`, a.street, block, a.phase].filter(Boolean).join(", ");
}

/** "Y Block, Phase 3" — the short line for headers. */
export function shortAddress(a: AddressLike): string {
  const block = /^[A-Z]{1,3}$/i.test(a.block) ? `${a.block} Block` : a.block;
  return `${block}, ${a.phase}`;
}
