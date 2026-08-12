import { apiPublic } from "./client";

export type AvailabilityResult = {
  emailAvailable: boolean;
  phoneAvailable: boolean;
  email?: string;
  phone?: string;
};

export const verificationApi = {
  checkAvailability: (input: { email?: string; phone?: string }) =>
    apiPublic<AvailabilityResult>("/verification/check-availability", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
