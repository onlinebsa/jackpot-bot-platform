"use client";

import { useEffect, useRef } from "react";

// fileName becomes the default file name when the customer saves the invoice as a PDF.
export function PrintButton({ fileName }: { fileName: string }) {
  const originalTitle = useRef<string | null>(null);

  useEffect(() => {
    const before = () => {
      if (originalTitle.current === null) originalTitle.current = document.title;
      document.title = fileName;
    };
    const after = () => {
      if (originalTitle.current !== null) {
        document.title = originalTitle.current;
        originalTitle.current = null;
      }
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, [fileName]);

  function handlePrint() {
    if (originalTitle.current === null) originalTitle.current = document.title;
    document.title = fileName;
    window.print();
  }

  return (
    <button className="btn no-print" style={{ marginBottom: 20 }} onClick={handlePrint}>
      Download / Print Invoice
    </button>
  );
}