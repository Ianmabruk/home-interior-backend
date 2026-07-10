import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export const AccountPage = () => {
  const { user, refreshUser } = useAuth()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    api.get('/orders/me').then((res) => setOrders(res.data)).catch(() => setOrders([]))
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h1 className="font-display text-5xl">My Account</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <section className="rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="font-display text-3xl">Profile</h2>
          <p className="mt-3 text-sm">Name: {user?.fullName}</p>
          <p className="text-sm">Email: {user?.email}</p>
          <p className="text-sm">Role: {user?.role}</p>
        </section>
        <section className="rounded-2xl border border-black/10 bg-white p-5 md:col-span-2">
          <h2 className="font-display text-3xl">Order History</h2>
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <article key={order._id} className="rounded-xl border border-black/10 p-3 text-sm">
                <p>Order #{order._id.slice(-6).toUpperCase()}</p>
                <p>Status: {order.status}</p>
                <p>Total: ${order.total}</p>
                {order.items?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-xs text-ink/60">
                        {item.name} x{item.quantity}
                        {item.variant?.colorName && <span> - {item.variant.colorName}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {!orders.length ? <p className="text-sm text-ink/65">No orders yet.</p> : null}
          </div>
        </section>
      </div>
    </div>
  )
}
