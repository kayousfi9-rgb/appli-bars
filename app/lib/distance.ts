// Distance en kilomètres entre deux points GPS (formule de haversine).

// Précise à quelques mètres près à l'échelle d'une ville : largement suffisant.

export function distanceKm(

  lat1: number,

  lon1: number,

  lat2: number,

  lon2: number

): number {

  const RAYON_TERRE_KM = 6371;

  const enRadians = (degres: number) => (degres * Math.PI) / 180;

  const dLat = enRadians(lat2 - lat1);

  const dLon = enRadians(lon2 - lon1);

  const a =

    Math.sin(dLat / 2) ** 2 +

    Math.cos(enRadians(lat1)) * Math.cos(enRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * RAYON_TERRE_KM * Math.asin(Math.sqrt(a));

}

