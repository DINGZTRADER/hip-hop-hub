import type { Metadata } from "next";
import { CypherTv } from "@/components/video/CypherTv";

export const metadata: Metadata = {
  title: "Cypher TV | Hip Hop Hub Uganda",
  description: "A continuous rotation of Ugandan hip-hop videos, up to one minute each.",
};

export default function CypherTvPage() {
  return <CypherTv />;
}
