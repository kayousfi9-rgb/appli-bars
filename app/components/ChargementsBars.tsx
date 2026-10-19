import { connection } from "next/server";

import { recupererBars } from "../lib/bars";

import { dateParis } from "../lib/utils";

import Explorateur from "./Explorateur";

export default async function ChargementBars() {

  // Dit à Next.js : « ces données changent tout le temps, ne les fige pas »

  await connection();

  const { bars, erreur } = await recupererBars();

  const aujourdhui = dateParis(new Date().toISOString());

  return <Explorateur bars={bars} aujourdhui={aujourdhui} erreur={erreur} />;

}