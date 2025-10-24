import { Button } from '../../shared/ui/components/Button'
import { Card } from '../../shared/ui/components/Card'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { toast } from '../../shared/utils/toastUtils'
import { useState, useEffect } from 'react'

export default function ProductCard({ item, view = 'grid' }) {
  const navigate = useNavigate();
  const [publisher, setPublisher] = useState(null);

  useEffect(() => {
    if (item.user) {
      // Assuming item.user is the ID of the user who posted the product
      fetch(`/api/auth/users/${item.user}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Network response was not ok');
          }
          return res.json();
        })
        .then(data => {
          // Assuming the user object has a 'username' or 'name' property
          setPublisher(data.username || data.name || 'Unknown User');
        })
        .catch(error => {
          console.error('Error fetching publisher:', error);
          setPublisher('Unknown User');
        });
    }
  }, [item.user]);
  // Process image URL to ensure it uses the correct path format
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
    if (imagePath.startsWith('/api/')) {
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
  // Get the image URL with fallback
  const getItemImageUrl = () => {
    try {
      // Check if item has images array
      if (!item.images || !Array.isArray(item.images) || item.images.length === 0) {
        return '/assets/placeholder-image.png';
      }
      
      // Get the first image
      const firstImage = item.images[0];
      // Handle different formats (could be object with url or direct string)
      const imagePath = firstImage.url || firstImage;
      return getImageUrl(imagePath);
    } catch (err) {
      console.error('Error getting image URL:', err);
      return '/assets/placeholder-image.png';
    }
  };
  
  // Use a placeholder image marker to prevent loops
  const PLACEHOLDER_IMAGE = '/assets/placeholder-image.png';
  
  // Get image URL once during render
  const img = getItemImageUrl();

  const badge = item.condition || (item.condition === undefined ? 'Used' : '')

  const handleAddToCart = (e) => {
    e.stopPropagation();
    const cart = JSON.parse(localStorage.getItem('sportifyCart') || '[]');
    const existingItem = cart.find(cartItem => cartItem.productId === item._id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        productId: item._id,
        title: item.title,
        price: item.price,
        image: img, // Use the processed image URL
        quantity: 1,
        addedAt: new Date().toISOString()
      });
    }
    
    localStorage.setItem('sportifyCart', JSON.stringify(cart));
    toast.success(`${item.title} added to cart!`);
  };

  const handleImageError = (e) => {
    if (e.target.src !== PLACEHOLDER_IMAGE) {
      e.target.onerror = null;
      e.target.src = PLACEHOLDER_IMAGE;
    }
  };

  if (view === 'list') {
    return (
      <Card variant="outline" className="hover:border-primary/60 transition-all duration-300" as="div">
        <div className="flex flex-col sm:flex-row items-start gap-4 p-4">
          <div className="w-full sm:w-48 h-40 sm:h-auto flex-shrink-0 relative rounded-lg overflow-hidden group cursor-pointer" onClick={() => navigate(`/equipment/${item._id}`)}>
            <img 
              src={img} 
              alt={item.title} 
              className="w-full h-full object-cover bg-card-alt transition-transform duration-300 group-hover:scale-105" 
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-muted-foreground">{item.category}</span>
              {badge && <span className="px-2.5 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium">{badge}</span>}
            </div>
            <h3 className="font-bold text-foreground text-xl cursor-pointer hover:text-primary" onClick={() => navigate(`/equipment/${item._id}`)}>{item.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{item.description}</p>
            {publisher && (
              <p className="text-xs text-muted-foreground mt-2">
                Published by: <span className="font-medium text-foreground">{publisher}</span>
              </p>
            )}
          </div>

          <div className="w-full sm:w-48 flex flex-col items-start sm:items-end gap-3 border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4">
            <div className="font-bold text-primary text-2xl">${item.price}</div>
            <div className="flex flex-col w-full gap-2">
              <Button size="lg" onClick={handleAddToCart} className="w-full">
                <ShoppingCart size={16} className="mr-2" /> Add to Cart
              </Button>
              <Button size="lg" variant="outline" className="w-full" onClick={() => navigate(`/equipment/${item._id}`)}>
                View Details
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="outline" className="p-0 overflow-hidden group flex flex-col h-full hover:border-primary/60 transition-all duration-300">
      <div className="relative h-52 w-full overflow-hidden cursor-pointer" onClick={() => navigate(`/equipment/${item._id}`)}>
        <img 
          src={img} 
          alt={item.title} 
          className="w-full h-full object-cover bg-card-alt transition-transform duration-300 group-hover:scale-105" 
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        {badge && <div className="absolute top-3 left-3 text-xs px-2.5 py-1 bg-primary/80 backdrop-blur-sm text-white rounded-full font-medium">{badge}</div>}
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-sm text-white/80">{item.category}</div>
          <h3 className="text-white font-bold text-lg truncate">{item.title}</h3>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 flex-grow">{item.description}</p>
        
        {publisher && (
          <p className="text-xs text-muted-foreground mt-3">
            Published by: <span className="font-medium text-foreground">{publisher}</span>
          </p>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="font-bold text-xl text-primary">${item.price}</div>
          <Button size="sm" variant="default" onClick={handleAddToCart}>
            <ShoppingCart size={16} className="mr-2" /> Add
          </Button>
        </div>
      </div>
    </Card>
  )
}
