import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../../../shared/ui/components/Container';
import { Card } from '../../../shared/ui/components/Card';
import { Button } from '../../../shared/ui/components/Button';
import { toast } from '../../../shared/utils/toastUtils';
import { Trash2, ShoppingCart, ArrowRight, XCircle, ArrowLeft } from 'lucide-react';

const getImageUrl = (imagePath) => {
  // Handle null or undefined case
  if (!imagePath) {
    return '/assets/placeholder-image.png';
  }
  
  // If it's already a full URL, use it as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it's already a properly formatted API path, use it as is
  if (imagePath.startsWith('/api/equipment/uploads/')) {
    return imagePath;
  }
  
  // Check for MongoDB ObjectID pattern in uploads path (24-character hex string followed by timestamp)
  if (imagePath.startsWith('/uploads/') && /\/uploads\/[0-9a-f]{24}-\d+-\d+/.test(imagePath)) {
    // Redirect to equipment service API path for these specific patterns
    const filename = imagePath.split('/').pop();
    return `/api/equipment/uploads/${filename}`;
  }
  
  // If the path is like /uploads/filename (other patterns)
  if (imagePath.startsWith('/uploads/')) {
    // Use the path as is - nginx will route to the correct service
    return imagePath;
  }
  
  // If it's just a filename, assume it's in uploads
  if (!imagePath.includes('/')) {
    return `/api/equipment/uploads/${imagePath}`;
  }
  
  // Default fallback for any other format
  return imagePath;
};

export default function ShoppingCartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    // Load cart items from localStorage
    const loadCartItems = () => {
      try {
        const savedCart = localStorage.getItem('sportifyCart');
        const parsedCart = savedCart ? JSON.parse(savedCart) : [];
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadCartItems();
  }, []);

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cartItems.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    setCartItems(updatedCart);
    localStorage.setItem('sportifyCart', JSON.stringify(updatedCart));
  };

  const removeFromCart = (productId) => {
    const updatedCart = cartItems.filter(item => item.productId !== productId);
    setCartItems(updatedCart);
    localStorage.setItem('sportifyCart', JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('sportifyCart');
  };

  // Calculate cart totals
  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const shipping = subtotal > 0 ? 5.99 : 0; // Example shipping cost
  const tax = subtotal * 0.08; // Example tax rate (8%)
  const total = subtotal + shipping + tax;

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      
      // Create a booking object for the payment
      const bookingId = `cart-${Date.now()}`;
      const userId = localStorage.getItem('userId') || 'guest-user';
      
      // Create a payment in the payment service
      const paymentResponse = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          userId,
          amount: total,
          currency: 'USD',
          success_url: `${window.location.origin}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/cart`,
        }),
      });
      
      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment');
      }
      
      const paymentData = await paymentResponse.json();
      
      // Store cart info in session storage for retrieval after payment
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        items: cartItems,
        subtotal,
        shipping,
        tax,
        total,
        paymentId: paymentData.paymentId,
        checkoutDate: new Date().toISOString(),
      }));
      
      // Redirect to payment page
      window.location.href = paymentData.url;
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('There was an error processing your checkout. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-40 bg-neutral-200 mb-8 rounded-md"></div>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-28 bg-neutral-200 rounded-lg"></div>
              ))}
            </div>
            <div className="mt-8 h-64 bg-neutral-200 rounded-lg"></div>
          </div>
        </div>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container className="py-12">
        <div className="max-w-lg mx-auto text-center">
          <Card className="p-10 shadow-lg border-neutral-200">
            <div className="w-24 h-24 mx-auto mb-6 text-neutral-400 flex items-center justify-center bg-neutral-100 rounded-full animate-pulse">
              <ShoppingCart className="w-12 h-12" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={() => navigate('/equipment')}
              className="w-full sm:w-auto hover:bg-primary/90 transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </div>
            </Button>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Shopping Cart ({cartItems.length})</h1>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/equipment')}
            className="hidden sm:flex"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <div className="divide-y divide-border">
                {cartItems.map((item) => (
                  <div key={item.productId} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div 
                      className="w-full sm:w-24 h-24 bg-neutral-100 rounded-md overflow-hidden flex-shrink-0 hover:opacity-90 transition-all duration-300 transform hover:scale-105 border border-transparent hover:border-primary/20"
                      onClick={() => navigate(`/equipment/${item.productId}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img 
                        src={getImageUrl(item.image)} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/assets/placeholder-image.png';
                        }}
                      />
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-grow">
                      <div className="flex flex-col sm:flex-row justify-between">
                        <div 
                          className="font-medium text-foreground hover:text-primary cursor-pointer"
                          onClick={() => navigate(`/equipment/${item.productId}`)}
                        >
                          {item.title}
                        </div>
                        <div className="font-bold text-foreground mt-2 sm:mt-0">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center">
                        {/* Quantity Selector */}
                        <div className="flex items-center">
                          <button 
                            className="w-8 h-8 flex items-center justify-center border border-border rounded-l-md bg-background hover:bg-neutral-100"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </button>
                          <div className="w-10 h-8 flex items-center justify-center border-t border-b border-border bg-background">
                            {item.quantity}
                          </div>
                          <button 
                            className="w-8 h-8 flex items-center justify-center border border-border rounded-r-md bg-background hover:bg-neutral-100"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </button>
                          <div className="ml-3 text-sm text-muted-foreground">
                            ${parseFloat(item.price).toFixed(2)} each
                          </div>
                        </div>
                        
                        {/* Remove Button */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 sm:p-6 border-t border-border flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/equipment')}
                  className="sm:hidden"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-lg">${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-full mb-4 transition-all duration-300 hover:bg-primary-dark"
                  onClick={handleCheckout}
                  disabled={checkingOut}
                >
                  {checkingOut ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Secure Checkout
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
                
                <div className="text-center text-xs text-muted-foreground">
                  Secure payment processing powered by our payment service.
                </div>
                
                <div className="mt-6 bg-primary/10 p-3 rounded-md">
                  <div className="text-sm text-primary font-medium mb-1">Note about checkout</div>
                  <div className="text-xs text-muted-foreground">
                    This demo will use a mock payment service. No real charges will be made.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}