import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Search, Package, TrendingUp, Tag, X, Check, Star, AlertCircle } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  rating: number;
  description: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  trackingNumber?: string;
  customerName: string;
  customerEmail: string;
  cardNumber: string;
}

interface Coupon {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
}

const EcommercePlatform = () => {
  // Charger les données depuis localStorage
  const loadFromStorage = (key: string, defaultValue: any) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [products, setProducts] = useState<Product[]>(() => loadFromStorage('products', [
    { id: 1, name: 'Laptop Pro 15"', price: 1299.99, image: '💻', category: 'Electronics', stock: 15, rating: 4.5, description: 'Puissant laptop pour professionnels' },
    { id: 2, name: 'Smartphone XR', price: 899.99, image: '📱', category: 'Electronics', stock: 25, rating: 4.7, description: 'Dernier smartphone avec 5G' },
    { id: 3, name: 'Casque Audio Pro', price: 299.99, image: '🎧', category: 'Audio', stock: 30, rating: 4.3, description: 'Réduction de bruit active' },
    { id: 4, name: 'Montre Connectée', price: 399.99, image: '⌚', category: 'Wearables', stock: 20, rating: 4.6, description: 'Suivi santé et fitness' },
    { id: 5, name: 'Tablette Ultra', price: 699.99, image: '📲', category: 'Electronics', stock: 18, rating: 4.4, description: 'Écran OLED 12 pouces' },
    { id: 6, name: 'Enceinte Bluetooth', price: 149.99, image: '🔊', category: 'Audio', stock: 40, rating: 4.2, description: 'Son immersif 360°' },
    { id: 7, name: 'Appareil Photo', price: 1599.99, image: '📷', category: 'Electronics', stock: 8, rating: 4.8, description: 'DSLR professionnel' },
    { id: 8, name: 'Console de Jeu', price: 499.99, image: '🎮', category: 'Gaming', stock: 12, rating: 4.9, description: 'Nouvelle génération' },
  ]));

  const [cart, setCart] = useState<CartItem[]>(() => loadFromStorage('cart', []));
  const [wishlist, setWishlist] = useState<number[]>(() => loadFromStorage('wishlist', []));
  const [orders, setOrders] = useState<Order[]>(() => loadFromStorage('orders', []));
  const [view, setView] = useState<'products' | 'cart' | 'orders' | 'wishlist' | 'compare'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Données de paiement
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [paymentErrors, setPaymentErrors] = useState<string[]>([]);

  const coupons: Coupon[] = [
    { code: 'WELCOME10', discount: 10, type: 'percentage' },
    { code: 'SAVE50', discount: 50, type: 'fixed' },
    { code: 'FLASH20', discount: 20, type: 'percentage' },
  ];

  // Sauvegarder 
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  // Gestion du panier
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      } else {
        alert(' Stock insuffisant');
      }
    } else {
      if (product.stock > 0) {
        setCart([...cart, { ...product, quantity: 1 }]);
      } else {
        alert(' Produit en rupture de stock');
      }
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product && quantity <= product.stock && quantity > 0) {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    } else if (quantity > product!.stock) {
      alert(` Stock maximum disponible: ${product!.stock}`);
    }
  };

  const toggleWishlist = (productId: number) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter(id => id !== productId));
    } else {
      setWishlist([...wishlist, productId]);
    }
  };

  const toggleCompare = (product: Product) => {
    if (compareList.find(p => p.id === product.id)) {
      setCompareList(compareList.filter(p => p.id !== product.id));
    } else if (compareList.length < 3) {
      setCompareList([...compareList, product]);
    } else {
      alert('Maximum 3 produits pour la comparaison');
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = calculateSubtotal();
    if (appliedCoupon.type === 'percentage') {
      return subtotal * (appliedCoupon.discount / 100);
    }
    return appliedCoupon.discount;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const applyCoupon = () => {
    const coupon = coupons.find(c => c.code === couponCode.toUpperCase());
    if (coupon) {
      setAppliedCoupon(coupon);
      alert(` Coupon ${coupon.code} appliqué avec succès!`);
    } else {
      alert(' Code coupon invalide');
    }
  };

  // Validation des données de paiement
  const validatePaymentData = (): boolean => {
    const errors: string[] = [];

    // Validation du nom
    if (!customerName.trim() || customerName.trim().length < 3) {
      errors.push('Le nom doit contenir au moins 3 caractères');
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail.trim() || !emailRegex.test(customerEmail)) {
      errors.push('Email invalide');
    }

    // Validation du numéro de carte 
    const cardNumberClean = cardNumber.replace(/\s/g, '');
    if (!cardNumberClean || cardNumberClean.length !== 16 || !/^\d+$/.test(cardNumberClean)) {
      errors.push('Numéro de carte invalide (16 chiffres requis)');
    }

    // Validation de la date d'expiration
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!cardExpiry || !expiryRegex.test(cardExpiry)) {
      errors.push('Date d\'expiration invalide (format MM/AA)');
    } else {
      const [month, year] = cardExpiry.split('/');
      const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
      if (expiryDate < new Date()) {
        errors.push('La carte est expirée');
      }
    }

    // Validation du CVV 
    if (!cardCVV || !/^\d{3,4}$/.test(cardCVV)) {
      errors.push('CVV invalide (3 ou 4 chiffres)');
    }

    setPaymentErrors(errors);
    return errors.length === 0;
  };

  // Processus de paiement avec validation
  const processPayment = () => {
    // Vérifier que toutes les données sont remplies
    if (!validatePaymentData()) {
      return;
    }

    // Vérifier le stock disponible
    let stockError = false;
    cart.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (!product || product.stock < item.quantity) {
        stockError = true;
        alert(` Stock insuffisant pour ${item.name}. Stock disponible: ${product?.stock || 0}`);
      }
    });

    if (stockError) return;

    // Créer la commande
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      date: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR'),
      items: [...cart],
      total: calculateTotal(),
      status: 'pending',
      trackingNumber: `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      cardNumber: '**** **** **** ' + cardNumber.slice(-4),
    };

    // Mettre à jour le stock 
    const updatedProducts = products.map(product => {
      const cartItem = cart.find(item => item.id === product.id);
      if (cartItem) {
        return { ...product, stock: product.stock - cartItem.quantity };
      }
      return product;
    });

    setProducts(updatedProducts);
    setOrders([newOrder, ...orders]);
    setCart([]);
    setAppliedCoupon(null);
    setShowCheckout(false);
    
    // Réinitialiser les champs
    setCustomerName('');
    setCustomerEmail('');
    setCardNumber('');
    setCardExpiry('');
    setCardCVV('');
    setPaymentErrors([]);

    alert(` Commande confirmée avec succès!\n\n📦 Numéro de commande: ${newOrder.id}\n🚚 Numéro de suivi: ${newOrder.trackingNumber}\n💰 Total payé: ${newOrder.total.toFixed(2)} €\n\n✉️ Un email de confirmation a été envoyé à ${newOrder.customerEmail}`);
    
    // Rediriger vers les commandes
    setView('orders');
  };

  const getRecommendations = () => {
    if (orders.length === 0) return [];
    const purchasedCategories = orders.flatMap(order =>
      order.items.map(item => item.category)
    );
    const mostCommonCategory = purchasedCategories.sort((a, b) =>
      purchasedCategories.filter(c => c === a).length - purchasedCategories.filter(c => c === b).length
    ).pop();
    return products.filter(p => p.category === mostCommonCategory && p.stock > 0).slice(0, 3);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Formater le numéro de carte
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">ShopPro</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher des produits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={() => setView('wishlist')}
                className="relative p-2 hover:bg-gray-100 rounded-lg"
              >
                <Heart className={`w-6 h-6 ${wishlist.length > 0 ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setView('cart')}
                className="relative p-2 hover:bg-gray-100 rounded-lg"
              >
                <ShoppingCart className="w-6 h-6 text-gray-600" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setView('orders')}
                className="relative p-2 hover:bg-gray-100 rounded-lg"
              >
                <Package className="w-6 h-6 text-gray-600" />
                {orders.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {orders.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex gap-4 mt-4 overflow-x-auto">
            <button
              onClick={() => setView('products')}
              className={`px-4 py-2 rounded-lg font-medium ${view === 'products' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Produits
            </button>
            <button
              onClick={() => setView('compare')}
              className={`px-4 py-2 rounded-lg font-medium ${view === 'compare' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Comparer ({compareList.length})
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Vue Produits */}
        {view === 'products' && (
          <div>
            {getRecommendations().length > 0 && (
              <div className="mb-8 bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold">Recommandé pour vous</h2>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {getRecommendations().map(product => (
                    <div key={product.id} className="border rounded-lg p-4 hover:shadow-lg transition">
                      <div className="text-4xl mb-2">{product.image}</div>
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      <p className="text-blue-600 font-bold">{product.price.toFixed(2)} €</p>
                      <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full mt-2 bg-blue-500 text-white py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 flex gap-2 overflow-x-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat === 'all' ? 'Tous' : cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-6xl">{product.image}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleWishlist(product.id)}
                          className="p-2 hover:bg-gray-100 rounded-full"
                        >
                          <Heart className={`w-5 h-5 ${wishlist.includes(product.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                        </button>
                        <button
                          onClick={() => toggleCompare(product)}
                          className={`p-2 hover:bg-gray-100 rounded-full ${
                            compareList.find(p => p.id === product.id) ? 'bg-blue-100' : ''
                          }`}
                        >
                          <TrendingUp className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                    
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">({product.rating})</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-blue-600">{product.price.toFixed(2)} €</span>
                      <span className={`text-sm font-bold ${product.stock === 0 ? 'text-red-600' : product.stock < 5 ? 'text-orange-600' : 'text-green-600'}`}>
                        {product.stock === 0 ? 'Rupture' : `${product.stock} en stock`}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vue Panier */}
        {view === 'cart' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Panier ({cart.length})</h2>
            
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Votre panier est vide</p>
                <button
                  onClick={() => setView('products')}
                  className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                >
                  Continuer vos achats
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  {cart.map(item => {
                    const currentProduct = products.find(p => p.id === item.id);
                    const availableStock = currentProduct?.stock || 0;
                    
                    return (
                      <div key={item.id} className="flex items-center gap-4 border rounded-lg p-4">
                        <div className="text-5xl">{item.image}</div>
                        <div className="flex-1">
                          <h3 className="font-bold">{item.name}</h3>
                          <p className="text-gray-600">{item.price.toFixed(2)} €</p>
                          <p className="text-sm text-gray-500">Stock disponible: {availableStock}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= availableStock}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{(item.price * item.quantity).toFixed(2)} €</p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 text-sm hover:underline"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-gray-50 rounded-lg p-6 h-fit">
                  <h3 className="font-bold text-lg mb-4">Résumé</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{calculateSubtotal().toFixed(2)} €</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-600">
                        <span>Réduction ({appliedCoupon.code})</span>
                        <span>-{calculateDiscount().toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-blue-600">{calculateTotal().toFixed(2)} €</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Code promo"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button
                        onClick={applyCoupon}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                      >
                        <Tag className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Codes: WELCOME10, SAVE50, FLASH20
                    </p>
                  </div>

                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-bold"
                  >
                    Procéder au paiement
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vue Commandes */}
        {view === 'orders' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Mes Commandes</h2>
            
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucune commande</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="border rounded-lg p-6 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">📦 {order.id}</h3>
                        <p className="text-gray-600 text-sm">📅 {order.date}</p>
                        <p className="text-sm text-gray-600 mt-1">👤 {order.customerName}</p>
                        <p className="text-sm text-gray-600">✉️ {order.customerEmail}</p>
                        <p className="text-sm text-gray-600">💳 {order.cardNumber}</p>
                        {order.trackingNumber && (
                          <p className="text-sm text-blue-600 mt-1 font-medium">
                            🚚 Suivi: {order.trackingNumber}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'delivered' ? '✅ Livré' :
                         order.status === 'shipped' ? '🚚 Expédié' :
                         order.status === 'processing' ? '⏳ En traitement' :
                         '🕐 En attente'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded-lg">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3">
                          <span className="text-2xl">{item.image}</span>
                          <span className="flex-1">{item.name}</span>
                          <span className="text-gray-600">x{item.quantity}</span>
                          <span className="font-medium">{(item.price * item.quantity).toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-4 flex justify-between items-center">
                      <span className="font-bold text-lg">Total payé</span>
                      <span className="text-2xl font-bold text-blue-600">{order.total.toFixed(2)} €</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vue Wishlist */}
        {view === 'wishlist' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Ma Liste de Souhaits</h2>
            
            {wishlist.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucun produit dans votre liste</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.filter(p => wishlist.includes(p.id)).map(product => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-5xl">{product.image}</div>
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    <h3 className="font-bold mb-2">{product.name}</h3>
                    <p className="text-blue-600 font-bold mb-2">{product.price.toFixed(2)} €</p>
                    <p className="text-sm text-gray-500 mb-4">Stock: {product.stock}</p>
                    <button
                      onClick={() => {
                        addToCart(product);
                        toggleWishlist(product.id);
                      }}
                      disabled={product.stock === 0}
                      className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vue Comparaison */}
        {view === 'compare' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Comparaison de Produits</h2>
            
            {compareList.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucun produit à comparer</p>
                <p className="text-sm text-gray-400 mt-2">Ajoutez jusqu'à 3 produits</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-4 text-left">Caractéristique</th>
                      {compareList.map(product => (
                        <th key={product.id} className="p-4 text-center relative">
                          <button
                            onClick={() => toggleCompare(product)}
                            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="text-4xl mb-2">{product.image}</div>
                          <div className="font-bold">{product.name}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Prix</td>
                      {compareList.map(product => (
                        <td key={product.id} className="p-4 text-center">
                          <span className="text-xl font-bold text-blue-600">{product.price.toFixed(2)} €</span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Note</td>
                      {compareList.map(product => (
                        <td key={product.id} className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <span className="font-bold">{product.rating}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Stock</td>
                      {compareList.map(product => (
                        <td key={product.id} className="p-4 text-center">
                          <span className={product.stock === 0 ? 'text-red-600' : product.stock < 5 ? 'text-orange-600' : 'text-green-600'}>
                            {product.stock === 0 ? 'Rupture' : `${product.stock} unités`}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Catégorie</td>
                      {compareList.map(product => (
                        <td key={product.id} className="p-4 text-center">
                          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                            {product.category}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">Action</td>
                      {compareList.map(product => (
                        <td key={product.id} className="p-4 text-center">
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            Ajouter
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

 
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">💳 Paiement</h2>
              <button
                onClick={() => {
                  setShowCheckout(false);
                  setPaymentErrors([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {paymentErrors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-800 mb-1">Erreurs de validation</h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      {paymentErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="jean.dupont@example.com"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Numéro de carte <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">16 chiffres requis</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Expiration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      setCardExpiry(value);
                    }}
                    placeholder="MM/AA"
                    maxLength={5}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    CVV <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardCVV}
                    onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="border-t pt-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-lg font-bold mb-2">
                  <span>Total à payer</span>
                  <span className="text-blue-600">{calculateTotal().toFixed(2)} €</span>
                </div>
                <p className="text-xs text-gray-600">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} article(s)
                </p>
              </div>
            </div>
            
            <button
              onClick={processPayment}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-bold flex items-center justify-center gap-2 transition"
            >
              <Check className="w-5 h-5" />
              Confirmer le paiement
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-4">
               Tous les champs sont obligatoires
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcommercePlatform;