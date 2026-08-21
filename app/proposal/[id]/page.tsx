import { notFound } from "next/navigation";
import { getDatabase } from "@/lib/db";
import { getProposal } from "@/lib/services/proposal";
import { parseProposalId } from "@/lib/validations";
import ProposalHero from "@/components/proposal/ProposalHero";
import ProposalIntro from "@/components/proposal/ProposalIntro";
import ProposalNotes from "@/components/proposal/ProposalNotes";
import ItineraryTimeline from "@/components/proposal/ItineraryTimeline";
import ProposalSummary from "@/components/proposal/ProposalSummary";
import ProposalActions from "@/components/proposal/ProposalActions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseProposalId(rawId);
  if (id === null) {
    return { title: "Proposal" };
  }

  try {
    const db = getDatabase();
    const detail = getProposal(db, id);
    return {
      title: `Your Itinerary — ${detail.reservation.villa}`,
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Proposal" };
  }
}

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseProposalId(rawId);
  if (id === null) {
    notFound();
  }

  let detail;
  try {
    const db = getDatabase();
    detail = getProposal(db, id);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background proposal-main">
      <meta name="robots" content="noindex, nofollow" />

      <article className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        <ProposalHero
          memberName={detail.reservation.member.name}
          destination={detail.reservation.destination}
          villa={detail.reservation.villa}
          arrivalDate={detail.reservation.arrivalDate}
          departureDate={detail.reservation.departureDate}
        />

        <ProposalIntro />

        <ProposalNotes notes={detail.proposal.notes} />

        <div className="my-12 h-px bg-border sm:my-16" />

        <ItineraryTimeline items={detail.items} />

        <div className="my-12 h-px bg-border sm:my-16" />

        <ProposalSummary
          itemCount={detail.items.length}
          total={detail.total}
          arrivalDate={detail.reservation.arrivalDate}
          departureDate={detail.reservation.departureDate}
        />

        <ProposalActions
          proposalId={detail.proposal.id}
          status={detail.proposal.status}
          destination={detail.reservation.destination}
          villa={detail.reservation.villa}
        />
      </article>
    </main>
  );
}
