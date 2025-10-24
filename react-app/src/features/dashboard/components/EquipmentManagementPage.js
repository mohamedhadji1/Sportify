import React, { useEffect, useState, useCallback } from 'react'
import { Card } from '../../../shared/ui/components/Card'
import { Button } from '../../../shared/ui/components/Button'
import { Container } from '../../../shared/ui/components/Container'
import { Tabs } from '../../../shared/ui/components/Tabs'
import LoadingSpinner from '../../../shared/ui/components/LoadingSpinner'
import { SkeletonLoader } from '../../../shared/ui/components/SkeletonLoader'
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowUpDown } from 'lucide-react'

export default function EquipmentManagementPage() {
  const [pendingItems, setPendingItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [token, setToken] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [approvedItems, setApprovedItems] = useState([])
  const [loadingApproved, setLoadingApproved] = useState(false)
  const [rejectedItems, setRejectedItems] = useState([])
  const [loadingRejected, setLoadingRejected] = useState(false)

  // Fetch pending equipment items for admin/manager to approve
  const fetchPendingItems = useCallback(async () => {
    // Always get the latest token directly from localStorage
    const currentToken = localStorage.getItem('token')
    
    if (!currentToken) {
      console.error("No token available to fetch pending items")
      setLoading(false)
      return
    }
    
    // More detailed debugging
    console.log({
      message: "Fetching pending items - debug info",
      userRole,
      isAdmin,
      tokenFromState: token ? token.substring(0, 15) + '...' : null,
      tokenFromLocalStorage: currentToken ? currentToken.substring(0, 15) + '...' : null,
      tokenMatch: token === currentToken
    })
    
    setLoading(true)
    try {
      const res = await fetch('/api/equipment/pending', { 
        headers: { 
          'x-auth-token': currentToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        } 
      })
      
      // Log response details
      console.log({
        status: res.status,
        statusText: res.statusText,
        headers: {
          'content-type': res.headers.get('content-type')
        }
      })
      
      if (!res.ok) {
        // Extract error details if possible
        let errorData = null
        try {
          errorData = await res.json()
          console.error("API Error Response:", errorData)
        } catch (e) {
          console.error(`API Error: ${res.status} ${res.statusText}`)
        }
        
        throw new Error(`Failed to fetch pending items: ${res.status} ${res.statusText}`)
      }
      
      const data = await res.json()
      console.log("API Response Data:", data)
      
      // Map additional status field
      const items = (data.products || []).map(item => ({
        ...item,
        status: 'pending'
      }))
      setPendingItems(items)

      // Placeholder: ideally fetch approved/rejected items as well
      // This would require additional API endpoints
      // For now, we'll just have empty lists
      setApprovedItems([])
      setRejectedItems([])
    } catch (e) {
      console.error('Failed to load pending equipment items', e)
    } finally {
      setLoading(false)
    }
  }, [token, isAdmin, userRole])
  
  // Action handler for approve/reject
  const handleAction = useCallback(async (id, action) => {
    if (!token) return
    
    try {
      const res = await fetch(`/api/equipment/${id}/${action}`, { 
        method: 'POST', 
        headers: { 
          'x-auth-token': token, 
          'Content-Type': 'application/json' 
        }, 
        body: JSON.stringify({ adminId: JSON.parse(localStorage.getItem('user') || '{}').id }) 
      })
      
      if (!res.ok) throw new Error(`Failed to ${action} item`)
      
      // Refetch the list after action
      await fetchPendingItems()
    } catch (e) {
      console.error(`Error while ${action} item:`, e)
    }
  }, [token, fetchPendingItems])

  // Read user data from localStorage once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      const storedToken = localStorage.getItem('token')
      
      console.log("Raw localStorage data:", { 
        userExists: !!stored, 
        tokenExists: !!storedToken,
        tokenLength: storedToken ? storedToken.length : 0
      })
      
      if (stored && storedToken) {
        const parsed = JSON.parse(stored)
        console.log("User data from localStorage:", { 
          id: parsed.id,
          email: parsed.email,
          role: parsed.role,
          roles: parsed.roles
        })
        
        const role = parsed.role || null
        setUserRole(role)
        
        // Check both uppercase and lowercase versions of admin role to ensure compatibility
        const adminRoles = ['admin', 'Admin', 'ADMIN', 'administrator', 'Administrator']
        const managerRoles = ['manager', 'Manager', 'MANAGER']
        
        const isUserAdmin = 
          adminRoles.includes(role) || 
          managerRoles.includes(role) ||
          (Array.isArray(parsed.roles) && 
            parsed.roles.some(r => adminRoles.includes(r) || managerRoles.includes(r)))
        
        console.log("Admin role check result:", isUserAdmin)
        
        setIsAdmin(isUserAdmin)
        setToken(storedToken)
      } else {
        console.log("No user data or token found in localStorage")
        setUserRole(null)
        setIsAdmin(false)
        setToken(null)
      }
    } catch (e) {
      console.error("Error parsing user data:", e)
      // ignore parse errors
      setUserRole(null)
      setIsAdmin(false)
      setToken(null)
    }
  }, [])
  
  // Fetch pending items when token is available
  useEffect(() => {
    if (isAdmin && token) {
      fetchPendingItems()
    }
  }, [isAdmin, token, fetchPendingItems])

  // Tab definitions
  const tabs = [
    { id: 'pending', label: 'Pending Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' }
  ]

  // Status badge renderer
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: {
        icon: <Clock size={14} className="mr-1" />,
        text: 'Pending',
        className: 'bg-amber-100 text-amber-800 border-amber-200'
      },
      approved: {
        icon: <CheckCircle size={14} className="mr-1" />,
        text: 'Approved',
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      rejected: {
        icon: <XCircle size={14} className="mr-1" />,
        text: 'Rejected',
        className: 'bg-red-100 text-red-800 border-red-200'
      }
    }

    const config = statusConfig[status] || statusConfig.pending

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${config.className}`}>
        {config.icon}
        {config.text}
      </span>
    )
  }

  // Item card renderer
  const ItemCard = ({ item, showActions = false }) => {
    return (
      <Card variant="interactive" className="overflow-visible p-0 transition-all duration-300">
        <div className="p-0">
          <div className="flex flex-col lg:flex-row lg:items-center p-4 gap-4">
            {/* Image thumbnail if available */}
            <div className="w-full lg:w-20 h-20 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
              {item.images && item.images[0] ? (
                <img 
                  src={`/api/equipment/uploads/${item.images[0].split('/').pop()}`} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to local placeholder instead of external service
                    e.target.onerror = null; // Prevent infinite loop
                    e.target.src = '/assets/placeholder-image.png';
                    // If local placeholder fails, use inline SVG
                    e.target.onerror = () => {
                      const parent = e.target.parentNode;
                      if (parent) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'w-full h-full flex items-center justify-center bg-gray-200 text-gray-500';
                        placeholder.textContent = 'No Image';
                        parent.replaceChild(placeholder, e.target);
                      }
                    };
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                  No Image
                </div>
              )}
            </div>
            
            {/* Item details */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2 justify-between">
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <StatusBadge status={item.status || 'pending'} />
              </div>
              
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 mb-2">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Category:</span> {item.category || 'Uncategorized'}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Price:</span> ${item.price} {item.currency || 'USD'}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Submitted:</span> {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground line-clamp-2">
                {item.description || 'No description provided'}
              </div>
            </div>
            
            {/* Action buttons */}
            {showActions && (
              <div className="flex items-center gap-2 mt-4 lg:mt-0">
                <Button 
                  size="sm" 
                  variant="success" 
                  onClick={() => handleAction(item._id || item.id, 'approve')}
                  className="w-full lg:w-auto"
                >
                  <CheckCircle size={16} className="mr-1" /> Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="danger" 
                  onClick={() => handleAction(item._id || item.id, 'reject')}
                  className="w-full lg:w-auto"
                >
                  <XCircle size={16} className="mr-1" /> Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="border border-border rounded-md p-4">
          <div className="flex gap-4">
            <SkeletonLoader width="w-20" height="h-20" rounded="rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <SkeletonLoader width="w-48" height="h-6" />
                <SkeletonLoader width="w-20" height="h-6" rounded="rounded-full" />
              </div>
              <div className="flex gap-4">
                <SkeletonLoader width="w-24" height="h-4" />
                <SkeletonLoader width="w-24" height="h-4" />
              </div>
              <SkeletonLoader width="w-full" height="h-4" />
              <SkeletonLoader width="w-2/3" height="h-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  // Empty state
  const EmptyState = ({ message = "No items found" }) => (
    <Card className="p-0">
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <AlertCircle size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">{message}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {activeTab === 'pending' 
            ? 'There are no equipment items pending review. Check back later or encourage users to submit new equipment.' 
            : 'No equipment items found in this category.'}
        </p>
      </div>
    </Card>
  )

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Equipment Management</h1>
        <p className="text-muted-foreground">Review, approve and manage equipment listings from users</p>
      </div>

      {!isAdmin ? (
        <Card variant="glass" className="p-0 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-amber-100">
              <AlertCircle size={24} className="text-amber-800" />
            </div>
            <div>
              <div className="font-medium text-lg">Admin access required</div>
              <div className="text-muted-foreground">You need admin or manager access to manage equipment</div>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card variant="elevated" className="p-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-muted-foreground">Pending Review</h3>
                  <div className="text-3xl font-bold mt-1">{pendingItems.length}</div>
                </div>
                <div className="p-2 rounded-full bg-amber-100">
                  <Clock size={24} className="text-amber-800" />
                </div>
              </div>
            </Card>
            
            <Card variant="elevated" className="p-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-muted-foreground">Approved</h3>
                  <div className="text-3xl font-bold mt-1">{approvedItems.length || "--"}</div>
                </div>
                <div className="p-2 rounded-full bg-green-100">
                  <CheckCircle size={24} className="text-green-800" />
                </div>
              </div>
            </Card>
            
            <Card variant="elevated" className="p-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-muted-foreground">Rejected</h3>
                  <div className="text-3xl font-bold mt-1">{rejectedItems.length || "--"}</div>
                </div>
                <div className="p-2 rounded-full bg-red-100">
                  <XCircle size={24} className="text-red-800" />
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs Navigation */}
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="mb-6"
          />
          
          {/* Tab Content */}
          <div className="mb-8">
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {loading ? (
                  <LoadingSkeleton />
                ) : pendingItems.length === 0 ? (
                  <EmptyState message="No pending items" />
                ) : (
                  <div className="space-y-4">
                    {pendingItems.map((item) => (
                      <ItemCard 
                        key={item._id || item.id} 
                        item={item}
                        showActions 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'approved' && (
              <div className="space-y-4">
                {loadingApproved ? (
                  <LoadingSkeleton />
                ) : approvedItems.length === 0 ? (
                  <EmptyState message="No approved items" />
                ) : (
                  <div className="space-y-4">
                    {approvedItems.map((item) => (
                      <ItemCard 
                        key={item._id || item.id} 
                        item={{...item, status: 'approved'}} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rejected' && (
              <div className="space-y-4">
                {loadingRejected ? (
                  <LoadingSkeleton />
                ) : rejectedItems.length === 0 ? (
                  <EmptyState message="No rejected items" />
                ) : (
                  <div className="space-y-4">
                    {rejectedItems.map((item) => (
                      <ItemCard 
                        key={item._id || item.id} 
                        item={{...item, status: 'rejected'}} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </Container>
  )
}
