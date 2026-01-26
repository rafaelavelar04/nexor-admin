import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const scrollPositions = new Map<string, number>();

export const useScrollRestoration = (scrollContainerRef: React.RefObject<HTMLElement>) => {
  const location = useLocation();
  const lastPathname = useRef<string | null>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      scrollPositions.set(location.pathname, scrollContainer.scrollTop);
    };

    // Salva a posição de rolagem enquanto o usuário navega
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // Restaura a posição ao voltar para uma página
    if (lastPathname.current !== location.pathname) {
      const savedPosition = scrollPositions.get(location.pathname);
      if (savedPosition !== undefined) {
        scrollContainer.scrollTop = savedPosition;
      } else {
        // Se não houver posição salva, vai para o topo
        scrollContainer.scrollTop = 0;
      }
      lastPathname.current = location.pathname;
    }

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, scrollContainerRef]);
};