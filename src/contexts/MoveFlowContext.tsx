"use client";

import { createContext, useContext } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";

type MoveFlowContextValue = ReturnType<typeof useCustomerFlow>;

const MoveFlowContext = createContext<MoveFlowContextValue | null>(null);

export function MoveFlowProvider({ children }: { children: React.ReactNode }) {
  const flow = useCustomerFlow();
  return <MoveFlowContext.Provider value={flow}>{children}</MoveFlowContext.Provider>;
}

export function useMoveFlow() {
  const ctx = useContext(MoveFlowContext);
  if (!ctx) throw new Error("useMoveFlow must be used within MoveFlowProvider");
  return ctx;
}
