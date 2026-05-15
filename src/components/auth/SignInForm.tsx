"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Retour au tableau de bord
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Connexion Qasr
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Saisissez votre email et mot de passe.
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {error ? (
                  <p className="text-sm text-error-500">{error}</p>
                ) : null}
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    placeholder="admin@qasr.dz"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label>
                    Mot de passe <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Rester connecté
                    </span>
                  </div>
                </div>
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Connexion…" : "Se connecter"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Pas encore de compte ? {""}
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  S’inscrire
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
