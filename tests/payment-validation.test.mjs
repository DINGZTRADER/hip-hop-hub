import test from "node:test";
import assert from "node:assert/strict";
import { matchesPurchase } from "../src/lib/payment-validation.ts";

const valid = { tx_ref: "ref-1", status: "successful", amount: 3000, currency: "UGX" };

test("only a matching verified UGX charge can fulfill a purchase", () => {
  assert.equal(matchesPurchase(valid, "ref-1", 3000), true);
  assert.equal(matchesPurchase({ ...valid, tx_ref: "other" }, "ref-1", 3000), false);
  assert.equal(matchesPurchase({ ...valid, currency: "NGN" }, "ref-1", 3000), false);
  assert.equal(matchesPurchase({ ...valid, amount: 2999 }, "ref-1", 3000), false);
  assert.equal(matchesPurchase({ ...valid, amount: Number.NaN }, "ref-1", 3000), false);
  assert.equal(matchesPurchase({ ...valid, status: "pending" }, "ref-1", 3000), false);
});
