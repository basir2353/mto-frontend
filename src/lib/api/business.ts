import { apiPublic } from "./client";

export type BusinessLeadInput = {
  workEmail: string;
  company: string;
  movesPerMonth?: string;
  message?: string;
};

export const businessApi = {
  submitLead: (input: BusinessLeadInput) =>
    apiPublic<{ message: string }>("/business/leads", { method: "POST", body: JSON.stringify(input) }),
};
