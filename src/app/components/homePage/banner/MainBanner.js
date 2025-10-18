'use client';

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Promises } from "../atoms/Promises";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function MainBanner() {
  const textRef = useRef(null);
  const revealRef = useRef(null);
  const [fontStyle, setFontStyle] = useState({ fontSize: "6.5rem", lineHeight: "1.2rem" });

  useEffect(() => {
    let outerTimer, innerTimer, fadeTimer, typingInterval;

    outerTimer = setTimeout(() => {
      const source = textRef.current;
      const target = document.getElementById("navbarTextTarget");
      const logo = document.getElementById("navbarLogo");
      if (!source || !target || !logo) return;

      source.style.transition = "opacity 0.4s ease-out";
      source.style.opacity = "0";

      const clone = source.cloneNode(true);
      const sourceRect = source.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      const gap = 8;

      const deltaX = logoRect.right + gap + 10 - sourceRect.left;
      const deltaY = logoRect.top + logoRect.height * 0.66 - sourceRect.top - 10;

      const computedStyle = window.getComputedStyle(source);
      const originalFontSize = computedStyle.fontSize;

      Object.assign(clone.style, {
        position: "fixed",
        left: `${sourceRect.left}px`,
        top: `${sourceRect.top}px`,
        margin: "0",
        zIndex: "9999",
        fontSize: originalFontSize,
        fontWeight: "bold",
        color: "white",
        transition: "transform 1.4s ease-in-out",
        transformOrigin: "top left",
        pointerEvents: "none",
        whiteSpace: "nowrap",
        opacity: "1",
        transform: "translate(0, 0) scale(1)",
      });

      document.body.appendChild(clone);

      requestAnimationFrame(() => {
        clone.style.transform = "translate(0, 0) scale(1)";
        clone.style.opacity = "1";

        requestAnimationFrame(() => {
          clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.2)`;
        });
      });

      fadeTimer = setTimeout(() => {
        clone.style.transition += ", opacity 0.6s ease-out";
        clone.style.opacity = "0";
      }, 1200);

      innerTimer = setTimeout(() => {
        clone.remove();
        target.style.opacity = "1";

        const phrase = "NORDNORSK HÅNDVERK";
        const container = revealRef.current;
        if (!container) return;

        container.innerHTML = "";

        const words = phrase.split(" ");
        words.forEach((word, i) => {
          const wordDiv = document.createElement("div");
          wordDiv.style.display = "block";
          wordDiv.style.textAlign = "center";
          wordDiv.style.marginBottom = i === 0 ? "0.1em" : "0";

          word.split("").forEach((char) => {
            const span = document.createElement("span");
            span.textContent = char;
            span.style.opacity = "0";
            span.style.transition = "opacity 0.3s ease";
            span.style.display = "inline-block";
            wordDiv.appendChild(span);
          });

          container.appendChild(wordDiv);
        });

        let letterIndex = 0;
        const spans = container.querySelectorAll("span");
        typingInterval = setInterval(() => {
          if (letterIndex < spans.length) {
            spans[letterIndex].style.opacity = "1";
            letterIndex++;
          } else {
            clearInterval(typingInterval);
          }
        }, isMobile ? 30 : 50);
      }, 1400);
    }, 2000);

    return () => {
      clearTimeout(outerTimer);
      clearTimeout(innerTimer);
      clearTimeout(fadeTimer);
      clearInterval(typingInterval);
    };
  }, []);

  useEffect(() => {
    const updateFont = () => {
      const width = window.innerWidth;
      let fontSize;
      const isMobile = width <= 768; // Define mobile breakpoint

      if (isMobile) {
        fontSize = Math.max(width / 150, 3.2);
      } else if (width <= 2500) {
        fontSize = Math.max(width / 170, 2.8);
      } else {
        fontSize = Math.max((width / 140) * 0.8, 2.8);
      }
      
      // Apply 20% size reduction on phone screens
      if (isMobile) {
        fontSize *= 0.8; // Reduce by 20%
      }

      let lineHeightMultiplier;
      if (width < 768) lineHeightMultiplier = 1.15;
      else if (width < 1600) lineHeightMultiplier = 1.3;
      else lineHeightMultiplier = 1.4;

      const lineHeight = fontSize * lineHeightMultiplier;
      setFontStyle({ fontSize: `${fontSize}rem`, lineHeight: `${lineHeight}rem` });
    };

    updateFont();
    window.addEventListener("resize", updateFont);
    return () => window.removeEventListener("resize", updateFont);
  }, []);

  return (
    <div className="relative z-10">
      <div className="mainBanner-cover bg-cover bg-center w-full min-h-[50vw] sm:min-h-[40vw] relative flex flex-col items-center justify-center overflow-visible">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/norland-a7730.appspot.com/o/products%2Fe4f4bb0f-812f-4dfc-b87b-897a088d1687?alt=media&token=b54ead1b-cbfd-40bd-b9bf-6fe98425d39a"
          alt="Main Banner"
          fill
          priority
          className="object-cover z-0"
        />

        <h2
          ref={textRef}
          className="text-white mb-0 z-10 relative
                     text-6xl sm:text-8xl md:text-8xl
                     [@media(min-width:700px)and(max-width:1270px)]:text-[7rem]
                     [@media(min-width:2000px)]:text-[10rem]"
        >
          NORYA
        </h2>

        <div
          ref={revealRef}
          className={`${poppins.className} text-center p-4 z-20 max-w-[90%] sm:max-w-[70%] relative -translate-y-6 sm:-translate-y-12 font-medium tracking-[0.05em]`}
          style={{
            color: "#cfbe20ff",
            fontSize: fontStyle.fontSize,
            lineHeight: fontStyle.lineHeight,
            whiteSpace: "nowrap",
            overflowWrap: "normal",
            wordBreak: "keep-all",
            textTransform: "uppercase",
          }}
        ></div>

        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-40">
          <Promises />
        </div>
      </div>
    </div>
  );
        }