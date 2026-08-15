"use client";

/** Pobranie Karty wydarzenia jako PDF — przez systemowe „Zapisz jako PDF". */
export function DrukujButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bez-druku rounded-full bg-brand-deep px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-navy"
    >
      Pobierz PDF karty
    </button>
  );
}
