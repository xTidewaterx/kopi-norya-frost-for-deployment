'use client';

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

export default function Navbar() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isOpen, setIsOpen] = useState(false);
  const [showNorya, setShowNorya] = useState(!isHomePage);
  const [logoSize, setLogoSize] = useState(36);
  const [textPaddingRight, setTextPaddingRight] = useState(8);
  const [atTop, setAtTop] = useState(true);
  const prevAtTop = useRef(true);

  useEffect(() => {
    const updateSizes = () => {
      const w = window.innerWidth;
      if (w < 768) {
        setLogoSize(36);
        setTextPaddingRight(8);
      } else if (w < 1600) {
        setLogoSize(48);
        setTextPaddingRight(10);
      } else {
        setLogoSize(44);
        setTextPaddingRight(12);
      }
    };

    updateSizes();
    window.addEventListener("resize", updateSizes);
    return () => window.removeEventListener("resize", updateSizes);
  }, []);

  useEffect(() => {
    if (isHomePage) {
      setShowNorya(false);
      const timer = setTimeout(() => {
        setShowNorya(true);
      }, 3200);
      return () => clearTimeout(timer);
    } else {
      setShowNorya(true);
    }
  }, [isHomePage]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const isNowAtTop = scrollY === 0;

      if (prevAtTop.current !== isNowAtTop) {
        console.log(isNowAtTop ? "Scrolled to top" : "Scrolled away from top");
        setAtTop(isNowAtTop);
        prevAtTop.current = isNowAtTop;
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // run once on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!atTop) return null;

  return (
    <nav className="w-full z-50 text-white bg-transparent pt-4 absolute top-0 left-0">
      <div className="max-w-9xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo + NORYA */}
          <Link href="/" className="group relative flex items-center m-0">
            <span className="absolute left-0 top-0 h-full w-full bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:w-[130%] transition-[opacity,width] duration-300 ease-out -z-10" />
            <div
              className="relative flex items-center justify-center z-10"
              style={{
                width: `${logoSize}px`,
                height: `${logoSize}px`,
              }}
            >
              <img
                id="navbarLogo"
                className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                src="/NORYA-logo.png"
                alt="NORYA Logo"
              />
            </div>
            <span
              id="navbarTextTarget"
              className={`text-2xl pl-2 font tracking-tight z-10 transition-opacity duration-[1400ms] ease-in-out ${
                showNorya ? "opacity-100" : "opacity-0 pr-6"
              }`}
              style={{
                lineHeight: `${logoSize}px`,
                display: showNorya ? "inline-block" : "none",
                verticalAlign: "middle",
                transformOrigin: "left center",
              }}
            >
              NORYA
            </span>
          </Link>

          {/* Hamburger Menu (Mobile) */}
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="md:hidden z-50 relative focus:outline-none"
            aria-label="Toggle Menu"
          >
            <svg
              className="w-6 h-6 transition-transform duration-300 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-6 h-full m-0 flex-nowrap">
            {[
              { href: "/sellers", label: "Selgere" },
              { href: "/products", label: "Produkter" },
              { href: "/omoss", label: "Om oss" },
              { href: "#", label: "Favoritter", extra: "pt-2" },
            ].map((item) => (
              <div className="hover:text-black" key={item.label}>
                <Link
                  href={item.href}
                  className={`whitespace-nowrap px-4 py-1 hover:text-black transition-all text-white rounded-full hover:bg-yellow-400 ${item.extra || ""}`}
                >
                  {item.label}
                </Link>
              </div>
            ))}

            <Link
              href="/products/cart"
              className="hover:bg-yellow-400 hover:text-black rounded-full px-4 py-1 group transition-all"
            >
              <img className="w-5" src="/shoppingCartIconWhite.png" alt="Cart" />
            </Link>

            <Link
              href="/profile"
              className="group hover:bg-yellow-400 rounded-full px-4 py-1 transition-all"
            >
              <FontAwesomeIcon className="group-hover:invert text-white" icon={faUser} />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <div
        className={`fixed top-0 left-0 w-full h-screen bg-blue-900 z-40 flex flex-col items-center text-white overflow-y-auto transition-all duration-500 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`flex flex-col items-center justify-center mt-12 mb-16 transition-all duration-500 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <img className="w-12 h-12 mb-6" src="/NORYA-logo.png" alt="NORYA Logo" />
          <span className="text-3xl font-semibold tracking-tight">NORYA</span>
        </div>

        <div
          className={`flex flex-col space-y-4 text-center transition-all duration-500 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          {[
            { href: "/sellers", label: "Selgere" },
            { href: "/products", label: "Produkter" },
            { href: "/omoss", label: "Om oss" },
            { href: "#", label: "Favoritter" },
            { href: "/products/cart", label: "Cart" },
            { href: "/profile", label: "Profil" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-white text-xl py-2 transition-all"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}