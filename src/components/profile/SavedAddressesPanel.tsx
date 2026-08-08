"use client";

import { useEffect, useState } from "react";
import { TextArea, TextInput } from "@/components/FormControls";
import { savedAddressesApi, type SavedAddress } from "@/lib/api";
import styles from "./SavedAddressesPanel.module.css";

const PROVINCES = ["ON", "BC", "AB", "QC", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "YT", "NU"];

type FormState = {
  label: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  instructions: string;
};

const emptyForm = (): FormState => ({
  label: "",
  street: "",
  city: "",
  province: "ON",
  postalCode: "",
  instructions: "",
});

export function SavedAddressesPanel() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchAddresses = async () => {
    setAddresses(await savedAddressesApi.list());
  };

  const load = async () => {
    setLoading(true);
    try {
      await fetchAddresses();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    // Mount-only fetch; setAddresses/setError land after the request resolves, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAddresses()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load addresses");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startEdit = (a: SavedAddress) => {
    setEditingId(a.id);
    setForm({
      label: a.label,
      street: a.street,
      city: a.city,
      province: a.province ?? "ON",
      postalCode: a.postalCode ?? "",
      instructions: a.instructions ?? "",
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.street.trim() || !form.city.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        label: form.label.trim(),
        street: form.street.trim(),
        city: form.city.trim(),
        province: form.province.trim() || null,
        postalCode: form.postalCode.trim() || null,
        country: "CA",
        instructions: form.instructions.trim() || null,
      };
      if (editingId) {
        await savedAddressesApi.update(editingId, body);
      } else {
        await savedAddressesApi.create({ ...body, isDefault: addresses.length === 0 });
      }
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save address");
    } finally {
      setBusy(false);
    }
  };

  const setDefault = async (id: string) => {
    setBusy(true);
    try {
      await savedAddressesApi.setDefault(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set default");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await savedAddressesApi.remove(id);
      if (editingId === id) cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete address");
    } finally {
      setBusy(false);
    }
  };

  const setField = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className={styles.panel} style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 16, padding: "22px 24px" }}>
      <h2 style={{ margin: "0 0 6px", font: "800 22px 'Archivo'" }}>Saved addresses</h2>
      <p style={{ margin: "0 0 18px", font: "500 14px 'Hanken Grotesk'", color: "#6B6B70" }}>
        Store pickup and drop-off locations with delivery instructions for faster booking.
      </p>

      {error && (
        <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 10, background: "rgba(168,68,42,.08)", color: "#a8442a", font: "600 13px 'Hanken Grotesk'" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#8A8A90" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {addresses.length === 0 ? (
            <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#8A8A90" }}>No saved addresses yet.</div>
          ) : (
            addresses.map((a) => (
              <div
                className={styles.addressRow}
                key={a.id}
                style={{
                  border: editingId === a.id ? "2px solid var(--accent)" : "1.5px solid rgba(0,0,0,.08)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  background: editingId === a.id ? "#fffbe6" : "#fff",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ font: "700 14px 'Hanken Grotesk'" }}>
                    {a.label} {a.isDefault ? <span style={{ color: "#1f6b1f" }}>· Default</span> : null}
                  </div>
                  <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>
                    {a.street}, {a.city}
                    {a.province ? `, ${a.province}` : ""}
                    {a.postalCode ? ` ${a.postalCode}` : ""}
                  </div>
                  {a.instructions && (
                    <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8A8A90", marginTop: 6, fontStyle: "italic" }}>
                      Note: {a.instructions}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
                  <button type="button" disabled={busy} onClick={() => startEdit(a)} style={chipBtn}>
                    Edit
                  </button>
                  {!a.isDefault && (
                    <button type="button" disabled={busy} onClick={() => void setDefault(a.id)} style={chipBtn}>
                      Set default
                    </button>
                  )}
                  <button type="button" disabled={busy} onClick={() => void remove(a.id)} style={{ ...chipBtn, color: "#a8442a" }}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <form onSubmit={save} style={{ display: "grid", gap: 12, padding: "16px 18px", borderRadius: 12, background: "#fafaf8", border: "1.5px solid rgba(0,0,0,.08)" }}>
        <div style={{ font: "800 15px 'Archivo'" }}>{editingId ? "Edit address" : "Add new address"}</div>
        <TextInput label="Label" value={form.label} onChange={(v) => setField("label", v)} placeholder="Home, Office, Storage unit…" />
        <TextInput label="Street address" value={form.street} onChange={(v) => setField("street", v)} placeholder="123 Main St, Unit 4B" />
        <div className={styles.cityRow} style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 12 }}>
          <TextInput label="City" value={form.city} onChange={(v) => setField("city", v)} placeholder="Toronto" />
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ font: "700 12px 'Hanken Grotesk'", color: "#3a3a40" }}>Province</span>
            <select
              value={form.province}
              onChange={(e) => setField("province", e.target.value)}
              style={{ height: 44, borderRadius: 10, border: "1.5px solid rgba(0,0,0,.14)", padding: "0 10px", font: "600 14px 'Hanken Grotesk'" }}
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
        <TextInput label="Postal code" value={form.postalCode} onChange={(v) => setField("postalCode", v)} placeholder="M5V 1A1" />
        <TextArea
          label="Delivery instructions (optional)"
          value={form.instructions}
          onChange={(v) => setField("instructions", v)}
          placeholder="Buzz 402, use rear entrance, elevator to 12th floor…"
          minHeight={72}
        />
        <div className={styles.actions} style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={busy} style={{ flex: 1, height: 44, borderRadius: 10, border: "none", background: "var(--accent)", font: "800 14px 'Archivo'", cursor: busy ? "wait" : "pointer" }}>
            {busy ? "Saving…" : editingId ? "Update address" : "Add address"}
          </button>
          {editingId && (
            <button type="button" disabled={busy} onClick={cancelEdit} style={{ height: 44, padding: "0 16px", borderRadius: 10, border: "1.5px solid rgba(0,0,0,.14)", background: "#fff", font: "700 13px 'Hanken Grotesk'", cursor: "pointer" }}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const chipBtn: React.CSSProperties = {
  height: 34,
  padding: "0 12px",
  borderRadius: 8,
  border: "1.5px solid rgba(0,0,0,.12)",
  background: "#fff",
  font: "700 12px 'Hanken Grotesk'",
  cursor: "pointer",
};
