import { useEffect } from "react";

export function useDocumentTitle(title) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${title} | SIBAYA`;

    return () => {
      document.title = originalTitle;
    };
  }, [title]);
}
