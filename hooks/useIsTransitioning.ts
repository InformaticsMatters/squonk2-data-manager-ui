import { useEffect, useState } from "react";

import { useRouter } from "next/router";

export const useIsTransitioning = (defaultValue: boolean) => {
  const [isTransitioning, setIsTransitioning] = useState(defaultValue);

  const router = useRouter();

  useEffect(() => {
    const animationStart = () => setIsTransitioning(true);
    const animationEnd = () => setIsTransitioning(false);

    router.events.on("routeChangeStart", animationStart);
    router.events.on("routeChangeComplete", animationEnd);
    router.events.on("routeChangeError", animationEnd);

    return () => {
      router.events.off("routeChangeStart", animationStart);
      router.events.off("routeChangeComplete", animationEnd);
      router.events.off("routeChangeError", animationEnd);
    };
  }, [router]);

  return isTransitioning;
};
