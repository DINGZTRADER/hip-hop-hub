import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ArtistOnboarding from "./ArtistOnboarding";

export default async function ArtistOnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=onboarding");
  return <ArtistOnboarding />;
}
