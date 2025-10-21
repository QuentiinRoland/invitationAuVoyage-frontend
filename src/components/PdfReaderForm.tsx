import React, { useRef, useState } from "react";
import { askOnce } from "../api/pdfReader";

export default function AskOnceForm() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setErr("");
    setAnswer("");

    if (!file) return setErr("Choisis un PDF.");
    if (!question.trim()) return setErr("Pose une question.");

    setLoading(true);
    abortRef.current = new AbortController();

    try {
      const data = await askOnce({
        file,
        question,
        signal: abortRef.current.signal,
      });
      setAnswer(data.answer);
    } catch (e: any) {
      console.error("askOnce error:", e);
      const status = e?.status as number | undefined;
      const detail = (e?.detail as string | undefined) ?? "Erreur serveur.";
      if (status === 400) setErr("Il manque le fichier ou la question.");
      else if (status === 413)
        setErr("Fichier trop volumineux ou question trop longue.");
      else if (status === 429) setErr("Quota dépassé côté OpenAI (429).");
      else setErr(detail);
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "grid", gap: 12, maxWidth: 520 }}
    >
      <div>
        <label>PDF</label>
        <br />
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div>
        <label>Question</label>
        <br />
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex: Quel est le premier chapitre ?"
        />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={loading}>
          {loading ? "Envoi..." : "Envoyer"}
        </button>
        {loading && (
          <button type="button" onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {answer && (
        <div>
          <h3>Réponse</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{answer}</pre>
        </div>
      )}
    </form>
  );
}
