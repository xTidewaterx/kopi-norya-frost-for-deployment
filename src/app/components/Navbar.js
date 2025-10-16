'use client';

import { useState, useEffect } from "react";
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
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);

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
      }, 3200); // ⏱️ Matches MainBanner disappearance
      return () => clearTimeout(timer);
    } else {
      setShowNorya(true);
    }
  }, [isHomePage]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll <= 0) {
        setShowNavbar(true);
      } else if (currentScroll > lastScroll) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScroll(currentScroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 text-white bg-transparent pt-4 transition-transform duration-300 ${
        showNavbar ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-9xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo + NORYA */}
          <Link
            href="/"
            className="group relative flex items-center m-0 transition-all"
          >
            <span className="absolute inset-0 bg-yellow-400 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100 -z-10"></span>

            <div
              className="relative flex items-center justify-center z-10 transition-all duration-300 group-hover:pl-2 group-hover:pr-2 group-hover:pt-1 group-hover:pb-1"
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
              className={`text-2xl pl-2 font tracking-tight z-10 transition-[opacity,transform] duration-[1400ms] ease-in-out group-hover:pl-4 group-hover:pr-4 group-hover:pt-1 group-hover:pb-1 ${
                showNorya ? "opacity-100 scale-100" : "opacity-0 scale-95"
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
          <div className="hidden md:flex items-center space-x-6 h-full m-0">
            {[
              { href: "/sellers", label: "Selgere" },
              { href: "/products", label: "Produkter" },
              { href: "/omoss", label: "Om oss" },
              { href: "#", label: "Favoritter", extra: "pt-2" },
            ].map((item) => (
              <div className="hover:text-black" key={item.label}>
                <Link
                  href={item.href}
                  className={`px-4 py-1 hover:text-black transition-all text-white rounded-full hover:bg-yellow-400 ${item.extra || ""}`}
                >
                  {item.label}
                </Link>
              </div>
            ))}

            <Link
              href="/products/cart"
              className="hover:bg-yellow-400 hover:text-black rounded-full px-4 py-1 group transition-all"
            >
              <img className="w-5" src="/shoppingCartIcon.png" alt="Cart" />
            </Link>

            <Link
              href="/profile"
              className="group hover:bg-blue-600 rounded-full px-4 py-1 transition-all"
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
        <div className={`flex flex-col items-center justify-center mt-12 mb-16 transition-all duration-500 ${isOpen ? "opacity-100" : "opacity-0"}`}>
          <img className="w-12 h-12 mb-6" src="/NORYA-logo.png" alt="NORYA Logo" />
          <span className="text-3xl font-semibold tracking-tight">NORYA</span>
        </div>

        <div className={`flex flex-col space-y-4 text-center transition-all duration-500 ${isOpen ? "opacity-100" : "opacity-0"}`}>
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