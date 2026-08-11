"use client";



import { useEffect, useState } from "react";

import Link from "next/link";

import { useAuth } from "@/contexts/AuthContext";

import { customersApi, type Booking, type Dispute } from "@/lib/api";

import { BookingDisputeBanner } from "@/components/booking/BookingDisputeBanner";

import { DisputeThreadPanel } from "@/components/dispute/DisputeThreadPanel";



export function CustomerDisputesPanel() {

  const { user } = useAuth();

  const [disputes, setDisputes] = useState<Array<Dispute & { route?: string }>>([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    (async () => {

      try {

        const bookings = await customersApi.listBookings();

        const all: Array<Dispute & { route?: string }> = [];

        for (const b of bookings) {

          for (const d of b.disputes ?? []) {

            all.push({ ...d, route: formatRoute(b) });

          }

        }

        all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setDisputes(all);

      } finally {

        setLoading(false);

      }

    })();

  }, []);



  const openCount = disputes.filter((d) => d.status === "open").length;



  return (

    <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 16, padding: "22px 24px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>

        <h2 style={{ margin: 0, font: "800 22px var(--font-archivo)" }}>Your disputes</h2>

        {openCount > 0 && (

          <span style={{ font: "700 12px var(--font-hanken)", color: "#a8442a", background: "rgba(168,68,42,.1)", padding: "4px 10px", borderRadius: 999 }}>

            {openCount} open

          </span>

        )}

      </div>

      <p style={{ margin: "0 0 18px", font: "500 14px var(--font-hanken)", color: "#6B6B70" }}>

        Track dispute status and chat with admin and your mover in the dispute room. Need help? See the{" "}

        <Link href="/customer-app/support" style={{ color: "#0E0E10", fontWeight: 700 }}>

          support guide

        </Link>

        .

      </p>



      {loading && <div style={{ font: "600 14px var(--font-hanken)", color: "#8A8A90" }}>Loading disputes…</div>}



      {!loading && disputes.length === 0 && (

        <div style={{ padding: "20px 22px", borderRadius: 12, background: "#fafaf8", font: "600 14px var(--font-hanken)", color: "#8A8A90" }}>

          No disputes on file. If something goes wrong with a move, open Track or History and use Manage this move → Raise dispute.

        </div>

      )}



      {!loading &&

        disputes.map((d) => (

          <div key={d.id} style={{ marginBottom: 20 }}>

            {d.route && (

              <div style={{ font: "700 13px var(--font-hanken)", color: "#6B6B70", marginBottom: 6 }}>{d.route}</div>

            )}

            <BookingDisputeBanner disputes={[d]} />

            {user?.id && (

              <div style={{ marginTop: 12 }}>

                <DisputeThreadPanel bookingId={d.bookingId} myUserId={user.id} compact />

              </div>

            )}

          </div>

        ))}

    </div>

  );

}



function formatRoute(b: Booking): string {

  const pickup =

    (b.pickupAddress as { street?: string } | undefined)?.street ?? b.request?.pickupAddress ?? "Pickup";

  const dest =

    (b.destinationAddress as { street?: string } | undefined)?.street ?? b.request?.destinationAddress ?? "Destination";

  return `${pickup} → ${dest}`;

}

