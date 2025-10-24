import { useEffect, useState, useMemo } from 'react'
import { Container } from '../../shared/ui/components/Container'
import { Card } from '../../shared/ui/components/Card'
import { Button } from '../../shared/ui/components/Button'
import ProductCard from './ProductCard'
import { Search } from 'lucide-react'

export default function ListingsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('grid') // grid | list
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const pageSize = 12

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/equipment')
        const data = await res.json()
        console.log('Products response:', data)
        // Correctly extract products array from response
        if (!cancelled) setItems(data.products && Array.isArray(data.products) ? data.products : [])
      } catch (e) {
        console.error('Failed to load listings', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => (cancelled = true)
  }, [])

  const categories = useMemo(() => ['All', 'Tennis', 'Football', 'Basketball', 'Fitness', 'Other'], [])

  const filtered = useMemo(() => {
    let arr = items.filter((it) => {
      if (category !== 'All' && it.category !== category) return false
      if (query && !(it.title || '').toLowerCase().includes(query.toLowerCase())) return false
      const price = Number(it.price || 0)
      if (minPrice && price < Number(minPrice)) return false
      if (maxPrice && price > Number(maxPrice)) return false
      return true
    })

    // sorting
    if (sort === 'price_asc') arr = arr.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    if (sort === 'price_desc') arr = arr.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    if (sort === 'newest') arr = arr.sort((a, b) => {
      const da = new Date(a.createdAt || a._created || a._id ? 0 : 0)
      const db = new Date(b.createdAt || b._created || b._id ? 0 : 0)
      return db - da
    })

    return arr
  }, [items, category, query, minPrice, maxPrice, sort])

  const total = filtered.length
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page])

  return (
    <Container className="py-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Equipment Marketplace</h1>
          <p className="text-muted-foreground mt-2">Discover quality sports gear from our community — buy, sell, or browse.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 order-2 lg:order-1">
            <Card className="p-4 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Search title or description..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-foreground"
                />
              </div>

              <label className="block text-sm text-muted-foreground mb-2">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground mb-4">
                {categories.map((c) => (
                  <option value={c} key={c}>{c}</option>
                ))}
              </select>

              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs">$</span>
                  <input placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="bg-input border border-border rounded-md w-full pl-7 pr-2 py-2 text-foreground text-sm" />
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs">$</span>
                  <input placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="bg-input border border-border rounded-md w-full pl-7 pr-2 py-2 text-foreground text-sm" />
                </div>
              </div>

              <label className="block text-sm text-muted-foreground mb-2">Sort</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground">
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>

              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" onClick={() => { setQuery(''); setCategory('All'); setMinPrice(''); setMaxPrice(''); setSort('newest'); setPage(1) }}>Clear</Button>
                <div className="ml-auto text-sm text-muted-foreground">{total} results</div>
              </div>
            </Card>
          </aside>

          <section className="w-full order-1 lg:order-2">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
              <div className="flex items-center gap-2">
                <div className="text-xs md:text-sm text-muted-foreground">View:</div>
                <div className="flex items-center border border-border rounded-md overflow-hidden">
                  <button
                    onClick={() => setView('grid')}
                    className={`px-3 py-1 text-xs flex items-center gap-1 ${view === 'grid' ? 'bg-primary text-white' : 'bg-background hover:bg-neutral-100'}`}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Grid
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`px-3 py-1 text-xs flex items-center gap-1 ${view === 'list' ? 'bg-primary text-white' : 'bg-background hover:bg-neutral-100'}`}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    List
                  </button>
                </div>
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">Showing {(page-1)*pageSize + 1}-{Math.min(page*pageSize, total)} of {total}</div>
            </div>

            {loading ? (
              <div className={view === 'grid' ? 'grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6' : 'space-y-4'}>
                {Array.from({length:9}).map((_,i) => (
                  <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-4 h-56" />
                ))}
              </div>
            ) : (
              <div className={view === 'grid' ? 'grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6' : 'space-y-4'}>
                {paged.map((item) => (
                  <ProductCard key={item._id || item.id} item={item} view={view} />
                ))}
                {paged.length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-neutral-800 p-6 rounded-lg inline-block shadow-lg">
                      <svg className="w-16 h-16 mx-auto text-neutral-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <h3 className="text-xl font-semibold text-white mb-2">No Products Available</h3>
                      <p className="text-neutral-400 mb-4">No approved products found in the marketplace</p>
                      <div className="text-sm text-neutral-500">
                        {query || category !== 'All' || minPrice || maxPrice ? 
                          'Try adjusting your filters to see more products' : 
                          'Products may need admin approval before appearing'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-3">
              <Button size="sm" onClick={() => setPage(Math.max(1, page-1))} disabled={page===1}>Previous</Button>
              <div className="text-sm text-muted-foreground">Page {page}</div>
              <Button size="sm" onClick={() => setPage(Math.min(Math.ceil(total/pageSize)||1, page+1))} disabled={page*pageSize >= total}>Next</Button>
            </div>
          </section>
        </div>
      </div>
    </Container>
  )
}
