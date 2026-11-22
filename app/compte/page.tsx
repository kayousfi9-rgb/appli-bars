"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

export default function PageCompte() {

  const router = useRouter();

  useEffect(() => {

    router.replace("/?onglet=profil");

  }, [router]);

  return <p className="p-6 text-center text-gray-500">Un instant…</p>;

}
