"use client";
import { useEffect } from "react";
import { useCart } from "react-use-cart";

export default function CartButton({ product }) {
  const { addItem, items } = useCart();



function AddProduct() {



 addItem(product)
 console.log("added product: ", product)

  


}



useEffect(() => {

    const productsInCart = items.map((item) => item);

    console.log(productsInCart)

}, [items])

  return (
    <button
    
      className="block text-center w-full px-6 py-2 border bg-blue-200  border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-all duration-200"
      onClick={() => {AddProduct()}}
    >
   Legg i handlekurv
    </button>
  );
}