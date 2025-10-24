import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '../../../shared/ui/components/Container';
import { Card } from '../../../shared/ui/components/Card';
import { Button } from '../../../shared/ui/components/Button';
import { toast } from '../../../shared/utils/toastUtils';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Share, 
  Check, 
  Star, 
  Tag, 
  Clock, 
  Shield, 
  TrendingUp 
} from 'lucide-react';

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

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    let isMounted = true
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/equipment/${productId}`)

        if (!isMounted) return

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Product not found (${response.status})`)
        }

        const data = await response.json()

        if (isMounted) {
          setProduct(data.product || data)
        }
      } catch (err) {
        console.error("Failed to fetch product:", err)
        if (isMounted) {
          setError(err.message || "Failed to load product details")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (productId) {
      fetchProduct()
    }

    return () => {
      isMounted = false
    }
  }, [productId])

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      
      // Get the current cart from localStorage or initialize a new one
      const currentCart = JSON.parse(localStorage.getItem('sportifyCart') || '[]');
      
      // Check if the item is already in the cart
      const existingItemIndex = currentCart.findIndex(item => item.productId === productId);
      
      if (existingItemIndex >= 0) {
        // Update quantity if already in cart
        currentCart[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to cart
        currentCart.push({
          productId: productId,
          title: product.title,
          price: product.price,
          image: product.images && product.images.length > 0 ? product.images[0] : null,
          quantity: quantity,
          addedAt: new Date().toISOString()
        });
      }
      
      // Save updated cart back to localStorage
      localStorage.setItem('sportifyCart', JSON.stringify(currentCart));
      
      // Show success message with toast
      toast.success(`${product.title} added to cart successfully!`);
      
      // Optionally navigate to cart page
      // navigate('/cart');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      toast.error('Failed to add to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      // First add to cart
      await handleAddToCart();
      
      // Then navigate to cart/checkout
      navigate('/cart');
    } catch (err) {
      console.error('Failed to process buy now:', err);
    }
  };

  if (loading) {
    return (
      <Container className="py-12">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-40 bg-neutral-200 mb-8 rounded-md"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-neutral-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-neutral-200 rounded-md"></div>
                <div className="h-6 w-1/2 bg-neutral-200 rounded-md"></div>
                <div className="h-24 bg-neutral-200 rounded-md"></div>
                <div className="h-10 w-32 bg-neutral-200 rounded-md"></div>
                <div className="h-12 bg-neutral-200 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-12">
        <Card className="max-w-lg mx-auto p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Product</h2>
          <p className="mb-6">{error || 'Product not found or unavailable'}</p>
          <Button onClick={() => navigate('/equipment')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Card>
      </Container>
    );
  }

  // Format the product images
  const productImages = product.images && product.images.length > 0 
    ? product.images.map(img => typeof img === 'string' ? img : (img.url || ''))
    : ['/assets/placeholder-image.png'];

  return (
    <Container className="py-12">
      <div className="max-w-6xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-transparent hover:text-primary" 
          onClick={() => navigate('/equipment')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Product Images */}
          <div>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 mb-4">
              <img 
                src={getImageUrl(productImages[mainImage])} 
                alt={product.title}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/placeholder-image.png';
                }}
              />
            </div>
            
            {/* Thumbnail images */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {productImages.map((img, idx) => (
                  <button 
                    key={idx}
                    className={`aspect-square rounded-md overflow-hidden ${
                      idx === mainImage ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
                    }`}
                    onClick={() => setMainImage(idx)}
                  >
                    <img 
                      src={getImageUrl(img)} 
                      alt={`${product.title} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/placeholder-image.png';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {product.condition || 'New'}
              </span>
              {product.inStock !== false && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 flex items-center">
                  <Check className="w-3 h-3 mr-1" />
                  In Stock
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-200 text-neutral-600">
                {product.category}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-foreground mb-2">{product.title}</h1>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="text-2xl font-bold text-foreground">${product.price}</div>
              {product.originalPrice && (
                <div className="text-lg text-muted-foreground line-through">${product.originalPrice}</div>
              )}
            </div>
            
            {/* Seller info */}
            {product.seller && (
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden">
                  {product.seller.avatar ? (
                    <img 
                      src={getImageUrl(product.seller.avatar)} 
                      alt={product.seller.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary text-white text-xs">
                      {product.seller.name?.charAt(0) || 'S'}
                    </div>
                  )}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Sold by </span>
                  <span className="font-medium text-foreground">{product.seller.name || 'Unknown Seller'}</span>
                </div>
              </div>
            )}
            
            {/* Product description */}
            <div className="mb-8">
              <h2 className="font-semibold text-foreground mb-2">Description</h2>
              <div className="prose prose-neutral">
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            </div>
            
            {/* Product specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mb-8">
                <h2 className="font-semibold text-foreground mb-3">Specifications</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex items-start">
                      <span className="text-sm font-medium text-muted-foreground w-24">{key}:</span>
                      <span className="text-sm text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">Quantity</label>
              <div className="flex items-center">
                <button 
                  className="w-10 h-10 flex items-center justify-center border border-border rounded-l-md bg-background hover:bg-neutral-100"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <div className="w-12 h-10 flex items-center justify-center border-t border-b border-border bg-background">
                  {quantity}
                </div>
                <button 
                  className="w-10 h-10 flex items-center justify-center border border-border rounded-r-md bg-background hover:bg-neutral-100"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Call to action buttons */}
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:space-x-3 mb-8">
              <Button 
                size="lg" 
                className="flex-1"
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </Button>
              <Button 
                variant="primary" 
                size="lg" 
                className="flex-1"
                onClick={handleBuyNow}
                disabled={addingToCart}
              >
                Buy Now
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Share className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Product features */}
            <Card variant="glass" className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-medium">Verified Product</h3>
                    <p className="text-xs text-muted-foreground">Quality checked by our team</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <Tag className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-medium">Best Price Guarantee</h3>
                    <p className="text-xs text-muted-foreground">Get the best deal</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-medium">Fast Delivery</h3>
                    <p className="text-xs text-muted-foreground">Quick and reliable shipping</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-medium">Popular Choice</h3>
                    <p className="text-xs text-muted-foreground">Trusted by athletes</p>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Reviews summary - placeholder for future enhancement */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${star <= 4 ? 'text-yellow-500 fill-yellow-500' : 'text-neutral-300'}`} 
                  />
                ))}
              </div>
              <span className="text-sm font-medium">(4.0)</span>
              <span className="text-sm text-muted-foreground">based on 42 reviews</span>
            </div>
          </div>
        </div>

        {/* Related Products - Placeholder for future enhancement */}
        {/*
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-6">You may also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map(product => (
              <ProductCard key={product.id} item={product} />
            ))}
          </div>
        </div>
        */}
      </div>
    </Container>
  );
}