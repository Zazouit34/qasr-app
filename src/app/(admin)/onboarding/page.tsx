"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { AMENITY_PRESETS, SERVICE_PRESETS } from "@/lib/onboarding-presets";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, Building2, Armchair, Utensils, Package, Sparkles, Gift } from "lucide-react";

const field =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white";

type VenuePayload = {
  name: string;
  address: string;
  city: string;
  wilaya: string;
  phone: string;
  email: string;
  capacity: number;
  description: string;
};

type Hall = { id: string; name: string; capacity: number; pricePerDay: number | null };

const STEPS = [
  { n: 1, label: "Le lieu", icon: Building2 },
  { n: 2, label: "Les salles", icon: Armchair },
  { n: 3, label: "Services", icon: Sparkles },
  { n: 4, label: "Menus", icon: Utensils },
  { n: 5, label: "Aménités", icon: Package },
  { n: 6, label: "Forfait", icon: Gift },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [progress, setProgress] = useState<{ percentComplete: number; isFinished: boolean } | null>(null);

  const [venue, setVenue] = useState<VenuePayload>({
    name: "",
    address: "",
    city: "",
    wilaya: "",
    phone: "",
    email: "",
    capacity: 200,
    description: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [hallForm, setHallForm] = useState({ name: "", capacity: 200, pricePerDay: "" });
  const [serviceKeys, setServiceKeys] = useState<Set<string>>(new Set());
  const [amenityKeys, setAmenityKeys] = useState<Set<string>>(new Set());

  const [menuName, setMenuName] = useState("Menu Bronze");
  const [menuLines, setMenuLines] = useState("Entrées variées\nPlat principal\nDessert");

  const [pkgName, setPkgName] = useState("Forfait Essentiel");
  const [pkgPrice, setPkgPrice] = useState("350000");
  const [pkgItems, setPkgItems] = useState("Salle, Buffet, Déco");

  useEffect(() => {
    void fetch("/api/venue", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success || !j.data) return;
        const v = j.data;
        setVenue({
          name: v.name ?? "",
          address: v.address ?? "",
          city: v.city ?? "",
          wilaya: v.wilaya ?? "",
          phone: v.phone ?? "",
          email: v.email ?? "",
          capacity: Number(v.capacity) || 200,
          description: v.description ?? "",
        });
        setHalls(Array.isArray(v.halls) ? v.halls : []);
      });

    void fetch("/api/venue/onboarding", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success || !j.data) return;
        setProgress(j.data as { percentComplete: number; isFinished: boolean });
      });
  }, []);

  const pctBar = progress?.percentComplete ?? 0;

  async function patchOnboarding(body: Record<string, boolean>) {
    const res = await fetch("/api/venue/onboarding", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (j.success && j.data) setProgress(j.data);
  }

  async function submitVenue(advance = true) {
    setLoading(true);
    try {
      const res = await fetch("/api/venue", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: venue.name.trim(),
          address: venue.address.trim(),
          city: venue.city.trim(),
          wilaya: venue.wilaya.trim(),
          phone: venue.phone.trim(),
          email: venue.email.trim(),
          capacity: venue.capacity,
          description: venue.description.trim() || null,
        }),
      });
      const j = await res.json();
      if (!j.success) {
        toast.error(j.error ?? "Erreur lieu");
        return;
      }

      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        const up = await fetch("/api/venue/logo", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        const uj = await up.json();
        if (!uj.success) toast.error(uj.error ?? "Logo non enregistré");
      }

      await patchOnboarding({ venue: true });
      toast.success("Lieu mis à jour");
      if (advance) setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function addHall(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const price =
        hallForm.pricePerDay.trim() === "" ? null : Number(hallForm.pricePerDay.replace(/\s/g, ""));
      const res = await fetch("/api/halls", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: hallForm.name.trim(),
          capacity: Number(hallForm.capacity) || 50,
          pricePerDay: price === null || Number.isNaN(price) ? null : price,
        }),
      });
      const j = await res.json();
      if (!j.success) {
        toast.error(j.error ?? "Salle impossible");
        return;
      }
      setHalls((prev) => [...prev, j.data]);
      setHallForm((f) => ({ ...f, name: "" }));
      toast.success("Salle ajoutée");
    } finally {
      setLoading(false);
    }
  }

  async function finishHalls() {
    if (halls.length < 1) {
      toast.error("Ajoutez au moins une salle avant de continuer.");
      return;
    }
    await patchOnboarding({ halls: true });
    setStep(3);
  }

  async function saveServices(skip: boolean) {
    setLoading(true);
    try {
      if (skip) {
        await patchOnboarding({ servicesSkipped: true });
        toast.message("Vous pourrez compléter le catalogue depuis Services.");
        setStep(4);
        return;
      }
      if (serviceKeys.size === 0) {
        toast.error("Cochez au moins un service ou utilisez Passer.");
        return;
      }
      const res = await fetch("/api/services/seed", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetKeys: [...serviceKeys] }),
      });
      const j = await res.json();
      if (!j.success) {
        toast.error(j.error ?? "Erreur enregistrement des services");
        return;
      }
      await patchOnboarding({ services: true });
      toast.success("Services enregistrés");
      setStep(4);
    } finally {
      setLoading(false);
    }
  }

  async function saveMenus(skip: boolean) {
    setLoading(true);
    try {
      if (skip) {
        await patchOnboarding({ menusSkipped: true });
        setStep(5);
        return;
      }
      const lines = menuLines
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((label, idx) => ({ label, sortOrder: idx }));
      const res = await fetch("/api/menu-templates", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: menuName.trim() || "Menu",
          items: lines.length ? lines : [{ label: "À définir", sortOrder: 0 }],
        }),
      });
      const j = await res.json();
      if (!j.success) {
        toast.error(j.error ?? "Menu impossible");
        return;
      }
      await patchOnboarding({ menus: true });
      toast.success("Menu enregistré");
      setStep(5);
    } finally {
      setLoading(false);
    }
  }

  async function saveAmenities() {
    if (amenityKeys.size === 0) {
      toast.error("Choisissez au moins un équipement.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/amenities/bulk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetKeys: [...amenityKeys] }),
      });
      const j = await res.json();
      if (!j.success) {
        toast.error(j.error ?? "Aménités impossible");
        return;
      }
      await patchOnboarding({ amenities: true });
      toast.success("Aménités enregistrées");
      setStep(6);
    } finally {
      setLoading(false);
    }
  }

  async function savePackage(skip: boolean) {
    setLoading(true);
    try {
      if (skip) {
        await patchOnboarding({ packageSkipped: true });
      } else {
        const labels = pkgItems.split(",").map((s) => s.trim()).filter(Boolean);
        const res = await fetch("/api/packages", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: pkgName.trim() || "Forfait",
            basePrice: Number(pkgPrice.replace(/\s/g, "")) || 0,
            items: labels.length ? labels.map((label) => ({ label })) : [{ label: "Prestations de base" }],
          }),
        });
        const j = await res.json();
        if (!j.success) {
          toast.error(j.error ?? "Forfait impossible");
          return;
        }
        await patchOnboarding({ package: true });
        toast.success("Forfait créé");
      }
      await patchOnboarding({ finish: true });
      toast.success("Configuration terminée !");
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const stepMeta = useMemo(() => STEPS.find((s) => s.n === step), [step]);

  return (
    <>
      <PageBreadCrumb pageTitle="Configuration guidée" />
      <div className="mx-auto max-w-3xl space-y-6">
        <ComponentCard
          title="Bienvenue — finalisez votre lieu"
          desc="Quelques minutes pour être prêt au calendrier, aux devis et aux contrats."
        >
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
              <span>Progression onboarding</span>
              <span>{pctBar}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-brand-500 transition-[width]"
                style={{ width: `${Math.min(100, pctBar)}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const active = step === s.n;
              return (
                <div
                  key={s.n}
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-theme-xs font-medium ${
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-100"
                      : "border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {s.label}
                </div>
              );
            })}
          </div>
        </ComponentCard>

        {step === 1 && (
          <ComponentCard
            title={stepMeta?.label ?? ""}
            desc="Informations légales et de facturation pour les documents."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Nom du lieu</span>
                <input className={`${field} mt-1.5`} value={venue.name} onChange={(e) => setVenue({ ...venue, name: e.target.value })} required />
              </label>
              <label className="sm:col-span-2">
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Adresse complète</span>
                <input className={`${field} mt-1.5`} value={venue.address} onChange={(e) => setVenue({ ...venue, address: e.target.value })} required />
              </label>
              <label>
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Ville</span>
                <input className={`${field} mt-1.5`} value={venue.city} onChange={(e) => setVenue({ ...venue, city: e.target.value })} required />
              </label>
              <label>
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Wilaya</span>
                <input className={`${field} mt-1.5`} value={venue.wilaya} onChange={(e) => setVenue({ ...venue, wilaya: e.target.value })} required />
              </label>
              <label>
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Téléphone lieu</span>
                <input className={`${field} mt-1.5`} value={venue.phone} onChange={(e) => setVenue({ ...venue, phone: e.target.value })} required />
              </label>
              <label>
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Email lieu</span>
                <input className={`${field} mt-1.5`} type="email" value={venue.email} onChange={(e) => setVenue({ ...venue, email: e.target.value })} />
              </label>
              <label>
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Capacité max</span>
                <input
                  type="number"
                  className={`${field} mt-1.5`}
                  value={venue.capacity}
                  onChange={(e) => setVenue({ ...venue, capacity: Number(e.target.value) })}
                />
              </label>
              <label className="sm:col-span-2">
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Description courte</span>
                <textarea
                  rows={3}
                  className={`${field} mt-1.5`}
                  value={venue.description}
                  onChange={(e) => setVenue({ ...venue, description: e.target.value })}
                />
              </label>
              <label className="sm:col-span-2">
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Logo (optionnel)</span>
                <input type="file" accept="image/*" className="mt-1.5 block w-full text-theme-sm" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={() => void submitVenue(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                Continuer <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </ComponentCard>
        )}

        {step === 2 && (
          <ComponentCard
            title={stepMeta?.label ?? ""}
            desc="Une salle au minimum pour accepter des réservations."
          >
            {halls.length > 0 ? (
              <ul className="mb-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
                {halls.map((h) => (
                  <li key={h.id} className="flex items-start gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-500" aria-hidden />
                    {h.name} — {h.capacity} pers.{h.pricePerDay != null ? ` · ${h.pricePerDay.toLocaleString("fr-DZ")} DZD/j` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-theme-sm text-amber-700 dark:text-amber-400">Ajoutez au moins une salle pour continuer.</p>
            )}

            <form onSubmit={addHall} className="grid gap-4 border-t border-gray-100 pt-4 dark:border-gray-800 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Nom de la salle</span>
                <input className={`${field} mt-1.5`} value={hallForm.name} onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })} required />
              </label>
              <label>
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Capacité</span>
                <input
                  type="number"
                  className={`${field} mt-1.5`}
                  value={hallForm.capacity}
                  onChange={(e) => setHallForm({ ...hallForm, capacity: Number(e.target.value) })}
                  min={10}
                />
              </label>
              <label>
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Tarif journée (DZD, optionnel)</span>
                <input
                  className={`${field} mt-1.5`}
                  value={hallForm.pricePerDay}
                  onChange={(e) => setHallForm({ ...hallForm, pricePerDay: e.target.value })}
                  placeholder="800000"
                />
              </label>
              <div className="flex items-end sm:col-span-2">
                <button type="submit" disabled={loading} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:bg-white/[0.04] disabled:opacity-50">
                  Ajouter la salle
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap justify-between gap-2">
              <button type="button" className="text-theme-sm font-medium text-gray-600 underline dark:text-gray-400" onClick={() => setStep(1)}>
                Retour
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void finishHalls()}
                className="rounded-lg bg-brand-500 px-5 py-2.5 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </ComponentCard>
        )}

        {step === 3 && (
          <ComponentCard
            title={stepMeta?.label ?? ""}
            desc="Ce catalogue apparaîtra sur vos lignes événements et futurs PDF."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {SERVICE_PRESETS.map((p) => {
                const sel = serviceKeys.has(p.key);
                return (
                  <label key={p.key} className="flex cursor-pointer items-start gap-2 rounded-xl border border-gray-200 p-3 dark:border-white/[0.08]">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-gray-300"
                      checked={sel}
                      onChange={() => {
                        setServiceKeys((prev) => {
                          const next = new Set(prev);
                          if (next.has(p.key)) next.delete(p.key);
                          else next.add(p.key);
                          return next;
                        });
                      }}
                    />
                    <span>
                      <span className="block text-theme-sm font-medium text-gray-800 dark:text-white">{p.name}</span>
                      <span className="text-theme-xs text-gray-500">{p.suggestedPrice.toLocaleString("fr-DZ")} DZD</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="text-theme-sm font-medium text-gray-600 underline dark:text-gray-400" onClick={() => setStep(2)}>
                Retour
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void saveServices(false)}
                className="rounded-lg bg-brand-500 px-5 py-2.5 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                Enregistrer
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void saveServices(true)}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-theme-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Passer pour l’instant
              </button>
            </div>
          </ComponentCard>
        )}

        {step === 4 && (
          <ComponentCard title={stepMeta?.label ?? ""} desc="Modèle de menu (Bronze / Argent…) — facultatif mais utile pour les mariages.">
            <label className="block">
              <span className="text-theme-sm text-gray-600 dark:text-gray-400">Nom du menu</span>
              <input className={`${field} mt-1.5`} value={menuName} onChange={(e) => setMenuName(e.target.value)} />
            </label>
            <label className="mt-4 block">
              <span className="text-theme-sm text-gray-600 dark:text-gray-400">Plats (une ligne = une ligne du menu)</span>
              <textarea rows={8} className={`${field} mt-1.5`} value={menuLines} onChange={(e) => setMenuLines(e.target.value)} />
            </label>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="text-theme-sm underline" onClick={() => setStep(3)}>
                Retour
              </button>
              <button type="button" disabled={loading} onClick={() => void saveMenus(false)} className="rounded-lg bg-brand-500 px-5 py-2.5 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
                Enregistrer
              </button>
              <button type="button" disabled={loading} onClick={() => void saveMenus(true)} className="rounded-lg border px-5 py-2.5 text-theme-sm font-medium dark:border-gray-600">
                Passer
              </button>
            </div>
          </ComponentCard>
        )}

        {step === 5 && (
          <ComponentCard title={stepMeta?.label ?? ""} desc="Ce que vos clients recherchent en priorité dans les devis et visites.">
            <div className="grid gap-3 sm:grid-cols-2">
              {AMENITY_PRESETS.map((p) => {
                const sel = amenityKeys.has(p.key);
                return (
                  <label key={p.key} className="flex cursor-pointer items-start gap-2 rounded-xl border border-gray-200 p-3 dark:border-white/[0.08]">
                    <input
                      type="checkbox"
                      checked={sel}
                      className="mt-1 rounded border-gray-300"
                      onChange={() => {
                        setAmenityKeys((prev) => {
                          const n = new Set(prev);
                          if (n.has(p.key)) n.delete(p.key);
                          else n.add(p.key);
                          return n;
                        });
                      }}
                    />
                    <span className="text-theme-sm font-medium text-gray-800 dark:text-white">{p.name}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="text-theme-sm underline" onClick={() => setStep(4)}>
                Retour
              </button>
              <button type="button" disabled={loading} onClick={() => void saveAmenities()} className="rounded-lg bg-brand-500 px-5 py-2 text-theme-sm font-medium text-white disabled:opacity-50">
                Continuer
              </button>
            </div>
          </ComponentCard>
        )}

        {step === 6 && (
          <ComponentCard
            title={stepMeta?.label ?? ""}
            desc="Combinez prix et postes inclus pour accélérer vos futurs dossiers clients."
          >
            <div className="grid gap-4">
              <label>
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Nom du forfait</span>
                <input className={`${field} mt-1.5`} value={pkgName} onChange={(e) => setPkgName(e.target.value)} />
              </label>
              <label>
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Prix DZD</span>
                <input className={`${field} mt-1.5`} value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} />
              </label>
              <label>
                <span className="text-theme-sm text-gray-600 dark:text-gray-400">Inclus (libellés séparés par des virgules)</span>
                <input className={`${field} mt-1.5`} value={pkgItems} onChange={(e) => setPkgItems(e.target.value)} />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="text-theme-sm underline" onClick={() => setStep(5)}>
                Retour
              </button>
              <button type="button" disabled={loading} onClick={() => void savePackage(false)} className="rounded-lg bg-brand-500 px-5 py-2.5 text-theme-sm font-medium text-white disabled:opacity-50">
                Terminer avec un forfait
              </button>
              <button type="button" disabled={loading} onClick={() => void savePackage(true)} className="rounded-lg border px-5 py-2.5 text-theme-sm font-medium dark:border-gray-600">
                Terminer sans forfait
              </button>
            </div>
          </ComponentCard>
        )}
      </div>
    </>
  );
}
