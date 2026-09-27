export interface VerifiedCharge {
  tx_ref: string;
  status: string;
  amount: number;
  currency: string;
}

export function matchesPurchase(
  charge: VerifiedCharge,
  reference: string,
  amountUgx: number
): boolean {
  return charge.tx_ref === reference &&
    charge.status === "successful" &&
    charge.currency === "UGX" &&
    Number.isFinite(charge.amount) &&
    charge.amount >= amountUgx;
}
