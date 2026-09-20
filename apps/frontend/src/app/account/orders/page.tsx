'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Price from "@/components/Price";
import { getMyOrders } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { Order } from "@/lib/types";
import { useUserStore } from "@/store/user.store";


export default function MyOrdersPage() {
  const storeToken = useUserStore((state) => state.token);
  const token = useMemo(() => storeToken ?? getAccessToken(), [storeToken]);
  const hasAuth = Boolean(token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<boolean>(hasAuth);

  useEffect(() => {
    if (!token) return;
    let active = true;
    getMyOrders(token, page).then((data) => {
      if (!active) return;
      setOrders(data?.results ?? []);
      setHasNext(Boolean(data?.next));
      setError(data ? "" : "Could not load orders. Please sign in again or retry.");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [token, page]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My orders</h1>
      <p className="text-sm text-slate-600">
        Track your purchases and deliveries.
      </p>
      {loading && <div className="text-sm text-slate-600">Loading orders...</div>}
      <div className="space-y-3">
        {hasAuth && orders.map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Order #{order.id}
              </div>
              <div className="text-xs text-slate-500">
                {order.status} - {order.delivery_time ?? "--"} min - {order.zone}
              </div>
            </div>
            <Price amount={order.total} className="text-sm font-semibold" />
          </Link>
        ))}
        {!hasAuth && !loading && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-700">
            Please sign in to see your orders.
          </div>
        )}
        {orders.length === 0 && !loading && hasAuth && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
            No orders yet. Start with your first checkout.
          </div>
        )}
      </div>
      {hasAuth && <div className="flex items-center justify-between text-sm">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>← Previous</button>
        <span>Page {page}</span><button disabled={!hasNext} onClick={() => setPage(page + 1)}>Next →</button>
      </div>}
      {error && <p role="alert" className="text-sm text-amber-800">{error}</p>}
    </div>
  );
}
