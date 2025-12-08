import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type LiveAnnouncerContextValue = {
  announce: (message: string) => void;
};

const LiveAnnouncerContext = createContext<LiveAnnouncerContextValue | null>(null);

interface LiveAnnouncerProviderProps {
  children: ReactNode;
}

export function LiveAnnouncerProvider({ children }: LiveAnnouncerProviderProps) {
  const [message, setMessage] = useState("");
  const announce = useCallback((value: string) => {
    setMessage(value);
  }, []);

  const contextValue = useMemo(() => ({ announce }), [announce]);

  return (
    <LiveAnnouncerContext.Provider value={contextValue}>
      {children}
      <div aria-live="polite" aria-atomic="true" role="status" className="sr-only">
        {message}
      </div>
    </LiveAnnouncerContext.Provider>
  );
}

export function useLiveAnnouncer() {
  const context = useContext(LiveAnnouncerContext);
  if (!context) {
    throw new Error("useLiveAnnouncer must be used within a LiveAnnouncerProvider");
  }
  return context;
}
