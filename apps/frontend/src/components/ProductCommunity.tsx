'use client';
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { requestJSON } from "@/lib/api";
import { useUserStore } from "@/store/user.store";

type Feedback = { id: number; author: string; rating: number | null; body: string; status: string; verified_purchase: boolean; created_at: string };
type FeedbackPage = { count: number; results: Feedback[]; next: string | null; previous: string | null; mine?: Feedback | null; summary?: { average: number | null; count: number; distribution: Record<string, number> } };
const subscribe = () => () => {};
export default function ProductCommunity({ slug }: { slug: string }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const storedToken = useUserStore(s => s.token);
  const token = hydrated ? storedToken : null;
  const userId = useUserStore(s => s.user?.id);
  return <CommunityPanel key={`${slug}:${token ? userId ?? "member" : "guest"}`} slug={slug} token={token} />;
}

function CommunityPanel({ slug, token }: { slug: string; token: string | null }) {
  const [kind, setKind] = useState<"reviews" | "comments">("reviews");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<FeedbackPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const path = `/api/v1/products/${encodeURIComponent(slug)}/${kind}/`;
  useEffect(() => {
    let active = true;
    requestJSON<FeedbackPage>(`${path}?page=${page}`, { ...(token ? { token } : {}) })
      .then(value => { if (active) { setData(value); setError(""); } })
      .catch(err => { if (active) { setData(null); setError(err instanceof Error ? err.message : "Could not load feedback."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, page, token, reload]);
  function changeKind(value: typeof kind) { if (value === kind) return; setKind(value); setPage(1); setData(null); setLoading(true); setMessage(""); setError(""); setBody(""); }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await requestJSON<Feedback>(path, { method: "POST", token, body: JSON.stringify({ body, ...(kind === "reviews" ? { rating } : {}) }) });
      setMessage(kind === "reviews" ? "Your review is saved and awaiting approval." : "Your comment is saved and awaiting approval.");
      setBody(""); setPage(1); setReload(n => n + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save feedback."); }
    finally { setBusy(false); }
  }
  return <section className="product-community" aria-labelledby="community-title"><div className="section-heading"><div><p className="section-kicker">From our community</p><h2 id="community-title">Reviews & comments</h2></div></div>
    <div role="tablist" aria-label="Product feedback" className="community-tabs" onKeyDown={e => { if (!busy && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) { e.preventDefault(); const next = e.key === "Home" ? "reviews" : e.key === "End" ? "comments" : kind === "reviews" ? "comments" : "reviews"; changeKind(next); document.getElementById(`tab-${next}`)?.focus(); } }}>{(["reviews", "comments"] as const).map(value => <button key={value} id={`tab-${value}`} role="tab" aria-selected={kind === value} tabIndex={kind === value ? 0 : -1} aria-controls="community-panel" disabled={busy} onClick={() => changeKind(value)}>{value === "reviews" ? "Ratings & reviews" : "Comments & questions"}</button>)}</div>
    <div id="community-panel" role="tabpanel" aria-labelledby={`tab-${kind}`}>
      {kind === "reviews" && data?.summary && <div className="review-summary"><div><strong>{data.summary.average == null ? "—" : Number(data.summary.average).toFixed(1)}<small> / 5</small></strong><p>{data.summary.count} published {data.summary.count === 1 ? "review" : "reviews"}</p></div><div className="review-distribution">{[5, 4, 3, 2, 1].map(star => <div key={star}><span>{star} ★</span><meter min={0} max={Math.max(1, data.summary!.count)} value={data.summary!.distribution[String(star)] || 0} aria-label={`${star} star reviews`} /><span>{data.summary!.distribution[String(star)] || 0}</span></div>)}</div></div>}
      <div className="community-layout"><div aria-busy={loading}>{loading ? <p className="page-intro" role="status">Loading feedback…</p> : data?.results.length ? <div className="feedback-list">{data.results.map(row => <article className="feedback-card" key={row.id}><div className="feedback-author"><strong>{row.author}</strong>{row.verified_purchase && <span className="verified-badge">Verified purchase</span>}<time dateTime={row.created_at}>{new Date(row.created_at).toLocaleDateString("en-GB", { timeZone: "UTC" })}</time></div>{row.rating != null && <p className="review-stars" aria-label={`${row.rating} out of 5 stars`}>{"★".repeat(row.rating)}<span aria-hidden="true">{"☆".repeat(5 - row.rating)}</span></p>}<p className="feedback-body">{row.body}</p></article>)}</div> : data && <div className="empty-state"><h3>{kind === "reviews" ? "Share the first review." : "Start the conversation."}</h3><p>{kind === "reviews" ? "Tell other shoppers about your experience with this product." : "Have a product question or something useful to share? Leave a comment."}</p></div>}
      {data && (data.previous || data.next) && <nav className="pagination-bar" aria-label="Feedback pages"><button disabled={!data.previous || loading} onClick={() => { setLoading(true); setPage(n => n - 1); }}>Previous</button><span>Page {page}</span><button disabled={!data.next || loading} onClick={() => { setLoading(true); setPage(n => n + 1); }}>Next</button></nav>}</div>
      <div className="surface-panel feedback-form"><h3>{kind === "reviews" ? "Your product review" : "Leave a comment"}</h3><p className="gallery-help">Reviews and comments appear after approval. Please keep personal details out of public feedback.</p>{token ? <form onSubmit={submit}>{kind === "reviews" && <><label htmlFor="review-rating">Your rating</label><select id="review-rating" value={rating} onChange={e => setRating(Number(e.target.value))} disabled={busy}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} {n === 1 ? "star" : "stars"}</option>)}</select>{data?.mine && <p className="gallery-help">Your review: {data.mine.status}. <button type="button" className="text-link" disabled={busy} onClick={() => { setBody(data.mine!.body); setRating(data.mine!.rating || 5); }}>Edit your review</button></p>}</>}<label htmlFor="feedback-body">{kind === "reviews" ? "Your experience" : "Comment or question"}</label><textarea id="feedback-body" value={body} onChange={e => setBody(e.target.value)} minLength={3} maxLength={2000} required rows={5} disabled={busy} placeholder={kind === "reviews" ? "What did you like? What could be better?" : "Ask about this product or share a useful detail."} /><small className="feedback-counter">{body.length}/2000</small><button className="button-primary mt-4" disabled={busy || body.trim().length < 3}>{busy ? "Saving…" : kind === "reviews" ? data?.mine ? "Update review" : "Submit review" : "Submit comment"}</button></form> : <Link className="button-primary mt-5" href="/account">Sign in to contribute</Link>}</div></div>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error} <button className="text-link" onClick={() => { setLoading(true); setReload(n => n + 1); }}>Retry loading</button></p>}{message && <p role="status" className="demo-notice mt-4">{message}</p>}
    </div>
  </section>;
}
