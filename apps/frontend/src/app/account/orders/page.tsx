'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Price from "@/components/Price";
import { getMyOrders } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { Order } from "@/lib/types";
import { useUserStore } from "@/store/user.store";

const fallbackOrders: Order[] = [
  { id: 5001, status: "PENDING", total: 1250, delivery_time: "60", zone: "dhaka" },
  { id: 5002, status: "DELIVERED", total: 980, delivery_time: "120", zone: "outside" },
];

export default function MyOrdersPage() {
  const storeToken = useUserStore((state) => state.token);
  const token = useMemo(() => storeToken ?? getAccessToken(), [storeToken]);
  const hasAuth = Boolean(token);
  const [orders, setOrders] = useState<Order[]>(fallbackOrders);
  const [loading, setLoading] = useState<boolean>(hasAuth);

  useEffect(() => {
    if (!token) return;
    let active = true;
    getMyOrders(token).then((data) => {
      if (!active) return;
      if (data) setOrders(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My orders</h1>
      <p className="text-sm text-slate-600">
        Customer view powered by /api/v1/my/orders.
      </p>
      {loading && <div className="text-sm text-slate-600">Loading orders...</div>}
      <div className="space-y-3">
        {orders.map((order) => (
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
    </div>
  );
}
