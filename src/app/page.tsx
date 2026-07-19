"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import ImageSlot from "@/components/ImageSlot";
import QuoteWidget from "@/components/QuoteWidget";
import RouteMap from "@/components/maps/RouteMap";
import type { MapPlace } from "@/lib/maps";
import { CheckBadge } from "@/components/ui/Icons";

export default function LandingPage() {
  const [pickupPlace, setPickupPlace] = useState<MapPlace>({ address: "" });
  const [dropoffPlace, setDropoffPlace] = useState<MapPlace>({ address: "" });

  return (
    <MarketingShell active="move">
      {/* HERO */}
      <div className="mto-hero">
        <div className="mto-hero-copy">
          <div className="mto-hero-eyebrow">
            <span className="mto-hero-eyebrow-dot" />
            ON-DEMAND MOVERS IN YOUR CITY
          </div>
          <h1 className="mto-hero-title">
            Move anything.
            <br />
            Right now.
          </h1>
          <p className="mto-hero-sub">
            Post what you need moved, get quotes from local drivers with SUVs, vans and trucks,
            and pick your price. No van rental, no waiting a week.
          </p>
          <QuoteWidget onPickupPlaceChange={setPickupPlace} onDropoffPlaceChange={setDropoffPlace} />
        </div>

        <div className="mto-hero-visual">
          {pickupPlace.address || dropoffPlace.address ? (
            <RouteMap
              pickup={pickupPlace}
              destination={dropoffPlace}
              fallbackLabel="Drop a hero photo — mover loading a van"
            />
          ) : (
            <ImageSlot
              placeholder="Drop a hero photo — mover loading a van"
              src="https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=1200&q=80"
              alt="Mover loading a van"
            />
          )}
          <div className="mto-hero-chip-bottom">
            <div className="mto-hero-chip-avatar" />
            <div>
              <div className="mto-hero-chip-title">Marcus arriving · 8 min</div>
              <div className="mto-hero-chip-meta">★ 4.9 · Cargo van</div>
            </div>
          </div>
          <div className="mto-hero-chip-top">
            <div className="mto-hero-chip-label">3 QUOTES IN</div>
            <div className="mto-hero-chip-price">from $180</div>
          </div>
        </div>
      </div>

      {/* STAT BAR */}
      <div className="mto-stats">
        <div className="mto-stats-grid">
          {[
            ["2 min", "avg. to first quote"],
            ["12k+", "verified drivers"],
            ["40+", "cities live"],
            ["4.9★", "avg. rating"],
          ].map(([n, l]) => (
            <div key={l} className="mto-stat">
              <div className="mto-stat-n">{n}</div>
              <div className="mto-stat-l">{l}</div>
            </div>
          ))}
        </div>
        <div className="mto-stats-note">No hidden fees · Insured moves · Cash on site</div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" className="mto-section mto-how">
        <div className="mto-section-intro">
          <div className="mto-eyebrow">How it works</div>
          <h2 className="mto-h2">From &quot;I need this moved&quot; to done — in three steps.</h2>
        </div>
        <div className="mto-how-grid">
          {[
            ["1", "Post your load", "Pickup, drop-off, what you're moving and when. Snap a photo if it helps."],
            [
              "2",
              "Compare quotes",
              "Nearby drivers bid for your job. Compare price, rating, vehicle and ETA — negotiate if you like.",
            ],
            [
              "3",
              "Track to the door",
              "Follow your driver live, chat in-app, and sign off on completion. Rate and you're done.",
            ],
          ].map(([n, title, body]) => (
            <div key={n} className="mto-how-card">
              <div className="mto-how-num">{n}</div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* VEHICLES */}
      <div id="vehicles" className="mto-section mto-vehicles">
        <div className="mto-vehicles-head">
          <h2 className="mto-h2-sm">A vehicle for every load</h2>
          <span className="mto-vehicles-note">Drivers bring exactly what fits</span>
        </div>
        <div className="mto-vehicles-grid">
          {[
            ["suv", "SUV", "Boxes, single items, small hauls", "from $30", "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80"],
            ["van", "Cargo van", "Couch, appliances, studio loads", "from $60", "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80"],
            ["pickup", "Pickup", "Bulky, open-bed, garden & gear", "from $55", "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"],
            ["truck", "Box truck", "1–2 bedrooms, big pickups", "from $120", "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80"],
          ].map(([id, title, desc, price, src]) => (
            <div key={id} className="mto-vehicle-card">
              <div className="mto-vehicle-media">
                <ImageSlot placeholder={title} src={src} alt={title} />
              </div>
              <div className="mto-vehicle-body">
                <div className="mto-vehicle-title">{title}</div>
                <div className="mto-vehicle-desc">{desc}</div>
                <div className="mto-vehicle-price">{price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MARKETPLACE FEATURE */}
      <div className="mto-section mto-market-wrap">
        <div className="mto-market">
          <div className="mto-market-copy">
            <div className="mto-eyebrow">The marketplace</div>
            <h2 className="mto-h2">You set the price bar. Drivers compete.</h2>
            <p className="mto-market-sub">
              Unlike a ride app, here movers bid for your job. Get several quotes side by side,
              counter-offer in chat, and book the one that fits your budget and timing.
            </p>
            <div className="mto-market-checks">
              {["Transparent, itemized quotes", "Built-in price negotiation", "Ratings & reviews on every driver"].map(
                (t) => (
                  <div key={t} className="mto-market-check">
                    <CheckBadge />
                    {t}
                  </div>
                )
              )}
            </div>
          </div>
          <div className="mto-market-panel">
            {[
              ["Marcus H.", "$210", "★ 4.9 · Cargo van · ~25 min", true],
              ["Bright Move Co.", "$260", "★ 4.8 · SUV · ~18 min", false],
              ["Dana R.", "$185", "★ 4.6 · Pickup · ~32 min", false],
            ].map(([name, price, meta, featured], i) => (
              <div
                key={name as string}
                className={featured ? "mto-quote-card is-featured" : "mto-quote-card"}
                style={{ opacity: i === 2 ? 0.72 : 1 }}
              >
                <div className="mto-quote-avatar" />
                <div className="mto-quote-body">
                  <div className="mto-quote-row">
                    <b>{name}</b>
                    <b className="mto-quote-price">{price}</b>
                  </div>
                  <div className="mto-quote-meta">{meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DRIVE & EARN */}
      <div className="mto-drive">
        <div className="mto-drive-visual">
          <ImageSlot
            placeholder="Drop a driver photo"
            src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=80"
            alt="Driver with van"
          />
          <div className="mto-drive-chip">
            <div className="mto-drive-chip-label">THIS WEEK</div>
            <div className="mto-drive-chip-value">$1,240 earned</div>
          </div>
        </div>
        <div className="mto-drive-copy">
          <div className="mto-drive-eyebrow">Drive &amp; earn</div>
          <h2 className="mto-drive-title">Got a truck? Get paid to move stuff.</h2>
          <p className="mto-drive-sub">
            Turn your SUV, van or pickup into income. See nearby jobs, send your own quote, and
            keep more of every fare. Cash out anytime.
          </p>
          <div className="mto-drive-actions">
            <Link href="/drive" className="mto-btn-accent">
              Start driving
            </Link>
            <Link href="/drive" className="mto-btn-ghost">
              How earnings work
            </Link>
          </div>
        </div>
      </div>

      {/* APP BAND */}
      <div className="mto-section mto-appband-wrap">
        <div className="mto-appband">
          <div>
            <h2 className="mto-appband-title">
              Your next move fits
              <br />
              in your pocket.
            </h2>
            <p className="mto-appband-sub">Install the app — works offline, tracks in real time.</p>
          </div>
          <div className="mto-appband-stores">
            <div className="mto-store-btn">App Store</div>
            <div className="mto-store-btn">Google Play</div>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
