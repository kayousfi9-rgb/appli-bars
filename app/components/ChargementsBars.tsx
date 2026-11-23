import { connection } from "next/server";
import { recupererBars } from "../lib/bars";
import { recupererCeSoir } from "../lib/cesoir";
import { dateParis } from "../lib/utils";
import Explorateur from "./Explorateur";
export default async function ChargementBars() {
  await connection();
  const [{ bars, erreur }, ceSoir] = await Promise.all([recupererBars(), recupererCeSoir()]);
  const aujourdhui = dateParis(new Date().toISOString());
  return (
    <Explorateur
      bars={bars}
      aujourdhui={aujourdhui}
      erreur={erreur}
      ceSoir={ceSoir.items}
      erreurCeSoir={ceSoir.erreur}
    />
  );
}
