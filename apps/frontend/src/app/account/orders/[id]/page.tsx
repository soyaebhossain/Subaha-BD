'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Price from "@/components/Price";
import { getMyOrder } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { Order } from "@/lib/types";
import { useUserStore } from "@/store/user.store";

const fallbackOrder: Order = {
  id: 9999,
  status: "PENDING",
  total: 1250,
  subtotal: 1100,
  delivery_fee: 80,
  discount: 0,
  delivery_time: "60",
  zone: "dhaka",
  items: [
    {
      product: {
        id: 1,
        name_en: "Sample product",
        slug: "sample",
        base_price: 550,
      },
      qty: 2,
      price: 550,
      total: 1100,
    },
  ],
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const storeToken = useUserStore((state) => state.token);
  const token = useMemo(() => storeToken ?? getAccessToken(), [storeToken]);
  const hasAuth = Boolean(token);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(hasAuth);

  useEffect(() => {
    if (!token) return;
    let active = true;
    getMyOrder(String(params.id), token).then((data) => {
      if (!active) return;
      setOrder(data ?? fallbackOrder);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [params.id, token]);

  if (!hasAuth && !loading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-700">
        Please sign in to view order details.
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-slate-600">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
        Order not found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id}</h1>
          <p className="text-sm text-slate-600">
            Status: {order.status} - {order.delivery_time} min - {order.zone}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2 border-b border-slate-200 pb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <Price amount={order.subtotal ?? 0} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Delivery</span>
            <Price amount={order.delivery_fee ?? 0} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Discount</span>
            <Price amount={order.discount ?? 0} />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-base font-bold text-slate-900">
          <span>Total</span>
          <Price amount={order.total} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Items</h3>
        <div className="mt-3 space-y-3">
          {order.items?.length ? (
            order.items.map((item, idx) => (
              <div
                key={`${item.product.id}-${idx}`}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    {item.product.name_en}
                  </div>
                  <div className="text-xs text-slate-500">Qty {item.qty}</div>
                </div>
                <Price amount={item.total} />
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-600">No line items found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
