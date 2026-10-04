import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { EmptyState, ErrorState, ArtisanCardSkeleton } from "@/components/ui/States";
import { StarRating } from "@/components/ui/StarRating";

// Living style guide. Development only.
export default function Design() {
  if (process.env.NODE_ENV === "production") notFound();
  const S = ({ t, children }: { t: string; children: React.ReactNode }) =>
    <section className="mt-8"><h2 className="mb-3 text-lg font-semibold">{t}</h2><div className="space-y-3">{children}</div></section>;
  return (
    <main className="mx-auto max-w-md p-6 pb-20">
      <h1 className="text-3xl font-bold text-brand">Design system</h1>
      <S t="Buttons"><div className="flex flex-wrap gap-2"><Button>Request service</Button><Button variant="accent">Call</Button><Button variant="outline">Save</Button><Button variant="danger">Suspend</Button><Button loading>Save</Button></div></S>
      <S t="Badges"><div className="flex flex-wrap gap-2"><Badge tone="verified">✓ Identity Verified</Badge><Badge tone="brand">Plumber</Badge><Badge tone="warning">Pending review</Badge><Badge tone="danger">Rejected</Badge><Badge>Not yet verified</Badge></div></S>
      <S t="Rating"><StarRating value={4.6} count={38} /><StarRating value={0} count={0} /></S>
      <S t="Form"><Input label="Full name" hint="As it appears on your ID." /><Input label="Phone number" error="Enter a valid Nigerian phone number" /><Textarea label="Describe the problem" /></S>
      <S t="Alerts"><Alert variant="info" title="Verification takes 1–2 working days" /><Alert variant="success" title="Request sent" /><Alert variant="warning" title="Location is off" >Turn it on to see artisans near you.</Alert><Alert variant="error" title="Couldn't save changes" >Check your connection and try again.</Alert></S>
      <S t="Card"><Card>Cards hold one artisan, request or review each.</Card></S>
      <S t="Loading"><ArtisanCardSkeleton /></S>
      <S t="Empty"><EmptyState icon="requests" title="No requests yet" body="When you request a service, you can track it here." action={{ label: "Find an artisan", href: "/search" }} /></S>
      <S t="Error"><ErrorState title="Couldn't load artisans" body="Check your connection and try again." action={{ label: "Try again" }} /></S>
    </main>
  );
}
