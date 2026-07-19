import { api, apiPublic } from "./client";

export type AvailabilityResult = {
  emailAvailable: boolean;
  phoneAvailable: boolean;
  email?: string;
  phone?: string;
};

export type VerificationResult = {
  ok: boolean;
  score: number;
  summary: string;
  issues: string[];
  provider: "openai" | "heuristic";
  details?: Record<string, unknown>;
};

export type DocumentType = "licence" | "insurance" | "vehiclePhoto" | "selfie";

export const verificationApi = {
  checkAvailability: (input: { email?: string; phone?: string }) =>
    apiPublic<AvailabilityResult>("/verification/check-availability", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  analyzeDocument: async (documentType: DocumentType, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    return api<VerificationResult>("/verification/document", {
      method: "POST",
      body: formData,
    });
  },

  matchVehicle: async (input: {
    file: File;
    vehicleType: string;
    make: string;
    model: string;
    year?: string;
  }) => {
    const formData = new FormData();
    formData.append("file", input.file);
    formData.append("vehicleType", input.vehicleType);
    formData.append("make", input.make);
    formData.append("model", input.model);
    if (input.year) formData.append("year", input.year);
    return api<VerificationResult>("/verification/vehicle-match", {
      method: "POST",
      body: formData,
    });
  },

  faceMatch: async (selfie: File, licence: File) => {
    const formData = new FormData();
    formData.append("selfie", selfie);
    formData.append("licence", licence);
    return api<VerificationResult>("/verification/face-match", {
      method: "POST",
      body: formData,
    });
  },
};
