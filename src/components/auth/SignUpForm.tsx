"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { WILAYAS } from "@/lib/constants/wilayas";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [venueName, setVenueName] = useState("");
  const [city, setCity] = useState("");
  const [wilaya, setWilaya] = useState("16 - Alger");
  const [venuePhone, setVenuePhone] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isChecked) {
      setError("Merci d’accepter les conditions.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          venueName,
          city,
          wilaya,
          venuePhone,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(typeof json.error === "string" ? json.error : "Inscription impossible.");
        setLoading(false);
        return;
      }
      const sign = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/onboarding",
      });
      if (sign?.error) {
        setError("Compte créé mais connexion automatique impossible. Connectez-vous manuellement.");
        setLoading(false);
        router.push("/signin");
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Retour
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto pb-10">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Créer un compte lieu
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Une salle créée automatiquement : vous configurerez salles détaillées et équipements ensuite.
            </p>
          </div>
          <div>
            <div className="relative py-3 sm:py-5 opacity-50 pointer-events-none">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                  Ou via e-mail ci-dessous
                </span>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                {error ? <p className="text-sm text-error-500">{error}</p> : null}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <Label>
                      Prénom <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label>
                      Nom <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom"
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                <div>
                  <Label>
                    Email professionnel <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@salon.dz"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label>
                    Mot de passe <span className="text-error-500">*</span>{" "}
                    <span className="text-theme-xs font-normal text-gray-400">(8 caractères min.)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                  <p className="mb-3 text-sm font-medium text-gray-800 dark:text-white/90">Votre lieu</p>
                  <div className="space-y-4">
                    <div>
                      <Label>
                        Nom de la salle / lieu <span className="text-error-500">*</span>
                      </Label>
                      <Input
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        placeholder="ex. Palais des fêtes El Djazair"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label>
                          Ville <span className="text-error-500">*</span>
                        </Label>
                        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Alger" required />
                      </div>
                      <div>
                        <Label>
                          Wilaya <span className="text-error-500">*</span>
                        </Label>
                        <select
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-white"
                          value={wilaya}
                          onChange={(e) => setWilaya(e.target.value)}
                          required
                        >
                          {WILAYAS.map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label>
                        Téléphone du lieu <span className="text-error-500">*</span>
                      </Label>
                      <Input
                        value={venuePhone}
                        onChange={(e) => setVenuePhone(e.target.value)}
                        placeholder="+213 …"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox className="w-5 h-5" checked={isChecked} onChange={setIsChecked} />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400 text-theme-sm">
                    J’accepte les conditions et la politique de confidentialité.
                  </p>
                </div>
                <div>
                  <Button className="w-full" size="sm" type="submit" disabled={loading}>
                    {loading ? "Création…" : "Créer le compte"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Déjà inscrit ?{" "}
                <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Connexion
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
