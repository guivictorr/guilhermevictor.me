import { useRef, useState, useEffect, MutableRefObject } from 'react';

export const useElementOnScreen = (
  options: IntersectionObserverInit,
): [MutableRefObject<null>, boolean] => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const callbackFunction: IntersectionObserverCallback = entries => {
    const [entry] = entries;
    setIsVisible(entry.isIntersecting);
  };

  useEffect(() => {
    const container = containerRef.current;
    const observer = new IntersectionObserver(callbackFunction, options);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      if (container) observer.unobserve(container);
    };
  }, [options]);

  return [containerRef, isVisible];
};
