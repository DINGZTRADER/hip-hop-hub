import type { Metadata } from "next";
import { CypherTv } from "@/components/video/CypherTv";

export const metadata: Metadata = {
  title: "Cypher TV | Hip Hop Hub Uganda",
  description: "A continuous 30-second rotation of Ugandan hip-hop videos.",
};

export default function CypherTvPage() {
  return <CypherTv />;
}
