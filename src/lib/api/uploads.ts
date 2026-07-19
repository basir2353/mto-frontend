import { apiOrigin } from "@/lib/env";
import { api } from "./client";

export const uploadsApi = {
  upload: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const result = await api<{ url: string; filename: string }>("/uploads", {
      method: "POST",
      body: formData,
    });
    const isAbsolute = /^(https?|blob|data):/i.test(result.url);
    return { ...result, url: isAbsolute ? result.url : `${apiOrigin}${result.url}` };
  },
};
