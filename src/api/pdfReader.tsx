import { api } from "./client";

export type AskOnceResponse = { answer: string };

export type AskOnceParameters = {
  file: File;
  question: string;
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
};

export async function askOnce({ file, question, signal }: AskOnceParameters) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("question", question);

  const res = await api.post("/ask-once/", fd, {
    signal,
  });

  return res.data;
}
