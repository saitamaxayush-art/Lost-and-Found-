import { useEffect, useState } from "react";

export function useSlidingIndicator(containerRef, activeKey, attribute = "data-indicator-key") {
  const [indicatorStyle, setIndicatorStyle] = useState({
    opacity: 0,
    transform: "translate3d(0, 0, 0)",
    width: 0,
    height: 0,
  });

  const attrName = attribute.replace(/^\[|\]$/g, "");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateIndicator = () => {
      try {
        const activeEl = container.querySelector(`[${attrName}="${activeKey}"]`);
        if (!activeEl) {
          setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
          return;
        }

        const containerRect = container.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();

        const left = activeRect.left - containerRect.left + container.scrollLeft;
        const top = activeRect.top - containerRect.top + container.scrollTop;

        setIndicatorStyle({
          opacity: 1,
          transform: `translate3d(${left}px, ${top}px, 0)`,
          width: activeRect.width,
          height: activeRect.height,
        });
      } catch (err) {
        console.warn("useSlidingIndicator query error:", err);
      }
    };

    updateIndicator();

    const resizeObserver = new ResizeObserver(() => {
      updateIndicator();
    });
    resizeObserver.observe(container);

    try {
      const activeEl = container.querySelector(`[${attrName}="${activeKey}"]`);
      if (activeEl) resizeObserver.observe(activeEl);
    } catch {}

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, activeKey, attrName]);

  return indicatorStyle;
}
