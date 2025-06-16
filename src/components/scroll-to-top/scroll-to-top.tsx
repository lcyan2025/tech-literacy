"use client";

import { useEffect, useState } from "react";
import { IconChevronUp } from "@tabler/icons-react";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <div className={`fixed ${isVisible ? "bottom-8" : "-bottom-20"} right-6`}>
      <button
        title="Back to top"
        onClick={scrollToTop}
        className="flex justify-center items-center size-10 bg-denim-500 hover:bg-denim-700 text-white rounded-full"
      >
        <IconChevronUp />
      </button>
    </div>
  );
};

export default ScrollToTop;
