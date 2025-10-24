import { useEffect, useState } from 'react'

export default function AdminPendingProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/equipment/pending', { headers: { 'x-auth-token': localStorage.getItem('token') } })
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchPending() }, [])

  const act = async (id, action) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/equipment/${id}/${action}`, { method: 'POST', headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId: localStorage.getItem('userId') }) })
      if (!res.ok) throw new Error('Failed')
      await fetchPending()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Pending Products</h2>
      {products.length === 0 && <div>No pending products</div>}
      <div className="space-y-4">
        {products.map(p => (
          <div key={p._id} className="p-4 border rounded flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm text-muted">{p.description}</p>
              <p className="mt-2 font-medium">{p.price} {p.currency}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => act(p._id, 'approve')} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
              <button onClick={() => act(p._id, 'reject')} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
