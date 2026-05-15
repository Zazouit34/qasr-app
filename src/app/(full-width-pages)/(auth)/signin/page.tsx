import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Connexion | Qasr",
  description: "Connexion à Qasr",
};

export default function SignIn() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-gray-500">Chargement…</p>}>
      <SignInForm />
    </Suspense>
  );
}
