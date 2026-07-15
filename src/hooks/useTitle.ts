import { useEffect } from "react";
import { useLocation } from "wouter";

const PAGE_META: Record<string, { title: string; description: string }> = {
  "/": { title: "FHP", description: "Fazuľové Herné Poklady - Tvoja kolekcia hier na jednom mieste." },
  "/kniznica": { title: "Knižnica", description: "Prehľadaj tisíce hier a nájdi si svoj titul." },
  "/ucet": { title: "Účet", description: "Spravuj svoj profil, pas a licencie." },
  "/dennik": { title: "Denník", description: "Prehľad tvojich transakcií a aktivít." },
  "/pasy": { title: "Pasy", description: "Vyber si členský pas a získaj prístup k hrám." },
  "/pomoc": { title: "Pomoc", description: "Časté otázky a podpora." },
  "/admin": { title: "Administrácia", description: "Správa používateľov a žiadostí." },
  "/prihlasenie": { title: "Prihlásenie", description: "Prihlás sa do svojho účtu." },
  "/registracia": { title: "Registrácia", description: "Vytvor si nový účet." },
};

export function useTitle() {
  const [location] = useLocation();

  useEffect(() => {
    const base = "FHP";
    const meta = PAGE_META[location];

    let title = base;
    let description = "Fazuľové Herné Poklady - Tvoja kolekcia hier na jednom mieste.";

    if (meta) {
      title = `${base} | ${meta.title}`;
      description = meta.description;
    } else if (location.startsWith("/hra/")) {
      title = `${base} | Hra`;
      description = "Detail hry v kolekcii FHP.";
    }

    document.title = title;

    let metaTag = document.querySelector('meta[name="description"]');
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.setAttribute("name", "description");
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute("content", description);
  }, [location]);
}
