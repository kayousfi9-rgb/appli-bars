"use client";

import dynamic from "next/dynamic";

const CarteDynamique = dynamic(() => import("./Carte"), {

  ssr: false,

  loading: () => (

    <div className="flex h-full items-center justify-center bg-gray-100 text-gray-500">

      Chargement de la carte…

    </div>

  ),

});

export default CarteDynamique;
