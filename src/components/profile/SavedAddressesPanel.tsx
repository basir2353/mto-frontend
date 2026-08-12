"use client";

import { useEffect, useState } from "react";
import { TextArea, TextInput } from "@/components/FormControls";
import PostalCodeInput from "@/components/maps/PostalCodeInput";
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
    <section className={styles.panel} aria-labelledby="saved-addresses-title">
      <div className={styles.head}>
        <h2 id="saved-addresses-title" className={styles.title}>
          Saved addresses
        </h2>
      </div>
      <p className={styles.subtitle}>
        Store pickup and drop-off locations with delivery instructions for faster booking.
      </p>

      {error ? <div className={styles.error}>{error}</div> : null}

      {loading ? (
        <div className={styles.muted}>Loading…</div>
      ) : (
        <div className={styles.list}>
          {addresses.length === 0 ? (
            <div className={styles.muted}>No saved addresses yet.</div>
          ) : (
            addresses.map((a) => (
              <div
                key={a.id}
                className={`${styles.addressRow} ${editingId === a.id ? styles.addressRowActive : ""}`}
              >
                <div className={styles.addressBody}>
                  <div className={styles.addressLabel}>
                    {a.label}
                    {a.isDefault ? <span className={styles.defaultBadge}>Default</span> : null}
                  </div>
                  <div className={styles.addressLine}>
                    {a.street}, {a.city}
                    {a.province ? `, ${a.province}` : ""}
                    {a.postalCode ? ` ${a.postalCode}` : ""}
                  </div>
                  {a.instructions ? <div className={styles.addressNote}>Note: {a.instructions}</div> : null}
                </div>
                <div className={styles.actions}>
                  <button type="button" disabled={busy} onClick={() => startEdit(a)} className={styles.chipBtn}>
                    Edit
                  </button>
                  {!a.isDefault ? (
                    <button type="button" disabled={busy} onClick={() => void setDefault(a.id)} className={styles.chipBtn}>
                      Set default
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void remove(a.id)}
                    className={`${styles.chipBtn} ${styles.chipDanger}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <form onSubmit={save} className={styles.form}>
        <div className={styles.formTitle}>{editingId ? "Edit address" : "Add new address"}</div>
        <TextInput
          label="Label"
          value={form.label}
          onChange={(v) => setField("label", v)}
          placeholder="Home, Office, Storage unit…"
        />
        <TextInput
          label="Street address"
          value={form.street}
          onChange={(v) => setField("street", v)}
          placeholder="123 Main St, Unit 4B"
        />
        <div className={styles.cityRow}>
          <TextInput label="City" value={form.city} onChange={(v) => setField("city", v)} placeholder="Toronto" />
          <label className={styles.provinceLabel}>
            <span>Province</span>
            <select
              value={form.province}
              onChange={(e) => setField("province", e.target.value)}
              className={styles.provinceSelect}
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
        <PostalCodeInput
          label="Postal code"
          value={form.postalCode}
          onChange={(v) => setField("postalCode", v)}
          placeholder="M5V 1A1"
          height={42}
        />
        <TextArea
          label="Delivery instructions (optional)"
          value={form.instructions}
          onChange={(v) => setField("instructions", v)}
          placeholder="Buzz 402, use rear entrance, elevator to 12th floor…"
          minHeight={72}
        />
        <div className={styles.formActions}>
          <button type="submit" disabled={busy} className={styles.submitBtn}>
            {busy ? "Saving…" : editingId ? "Update address" : "Add address"}
          </button>
          {editingId ? (
            <button type="button" disabled={busy} onClick={cancelEdit} className={styles.cancelBtn}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
