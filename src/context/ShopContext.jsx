import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'

const ShopContext = createContext(null)

const STORAGE_PREFIX = 'hok_cart'
const GUEST_KEY = 'hok_local_cart'
const LOCAL_WISHLIST_KEY = 'hok_local_wishlist'

const getCartKey = (user, isAuthenticated) =>
  isAuthenticated && user?.id ? `${STORAGE_PREFIX}_${user.id}` : GUEST_KEY

const readCart = (key) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const writeCart = (key, items) => {
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // storage unavailable
  }
}

const getLocalWishlist = () => {
  try {
    const raw = localStorage.getItem(LOCAL_WISHLIST_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const setLocalWishlist = (items) => {
  try {
    localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(items))
  } catch {
    // storage unavailable
  }
}

export function ShopProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const cartKey = getCartKey(user, isAuthenticated)
  const keyRef = useRef(cartKey)

  const [cart, setCart] = useState(() => readCart(cartKey))
  const [wishlist, setWishlist] = useState(getLocalWishlist)
  const [loading] = useState(false)

  useEffect(() => {
    keyRef.current = cartKey
  }, [cartKey])

  // Load the cart that belongs to the currently authenticated customer.
  // When a user logs in we carry over any existing guest cart so their items
  // are not lost, while still keeping each customer's cart isolated.
  useEffect(() => {
    const newKey = keyRef.current
    const incoming = readCart(newKey)
    if (isAuthenticated && user?.id) {
      const guestItems = readCart(GUEST_KEY)
      if (guestItems.length && incoming.length === 0) {
        writeCart(newKey, guestItems)
        writeCart(GUEST_KEY, [])
        setCart(guestItems)
        return
      }
    }
    setCart(incoming)
  }, [cartKey, isAuthenticated, user?.id])

  useEffect(() => {
    setWishlist(getLocalWishlist())
  }, [])

  const addToCart = useCallback(async (product, variant, quantity = 1) => {
    const key = keyRef.current
    const cartItem = {
      _id: product._id,
      id: product._id,
      name: product.name,
      variantName: variant?.color || variant?.name || null,
      variantId: variant?._id || variant?.id || null,
      category: product.category || '',
      image: variant?.image || product.images?.[0] || product.mainImage || '',
      selectedVariant: variant || null,
      quantity,
      price: variant?.price || product.discountPrice || product.price || 0,
      discountPrice: product.discountPrice || null,
    }

    const local = readCart(key)
    const existingIndex = local.findIndex(
      (item) => item._id === cartItem._id && JSON.stringify(item.selectedVariant) === JSON.stringify(cartItem.selectedVariant)
    )
    if (existingIndex >= 0) {
      local[existingIndex].quantity += quantity
    } else {
      local.push(cartItem)
    }
    writeCart(key, local)
    setCart(local)
    return local
  }, [])

  const removeFromCart = useCallback(async (productId, variant) => {
    const key = keyRef.current
    const local = readCart(key).filter(
      (item) => !(item._id === productId && JSON.stringify(item.selectedVariant) === JSON.stringify(variant))
    )
    writeCart(key, local)
    setCart(local)
    return local
  }, [])

  const setCartQuantity = useCallback(async (productId, quantity, variant) => {
    if (quantity <= 0) {
      return removeFromCart(productId, variant)
    }

    const key = keyRef.current
    const local = readCart(key)
    const idx = local.findIndex(
      (item) => item._id === productId && JSON.stringify(item.selectedVariant) === JSON.stringify(variant)
    )
    if (idx >= 0) {
      local[idx].quantity = quantity
      writeCart(key, local)
      setCart(local)
    }
    return local
  }, [removeFromCart])

  const clearCart = useCallback(async () => {
    writeCart(keyRef.current, [])
    setCart([])
  }, [])

  const fetchCart = useCallback(async () => {
    const local = readCart(keyRef.current)
    setCart(local)
    return local
  }, [])

  const fetchWishlist = useCallback(async () => {
    const local = getLocalWishlist()
    setWishlist(local)
    return local
  }, [])

  const addToWishlist = useCallback(async (productId) => {
    const local = getLocalWishlist()
    if (!local.some((item) => item._id === productId)) {
      local.push({ _id: productId, id: productId })
      setLocalWishlist(local)
      setWishlist(local)
    }
    return local
  }, [])

  const removeFromWishlist = useCallback(async (productId) => {
    const local = getLocalWishlist().filter((item) => item._id !== productId)
    setLocalWishlist(local)
    setWishlist(local)
    return local
  }, [])

  const toggleWishlist = useCallback(async (product) => {
    const inWishlist = Array.isArray(wishlist) && wishlist.some((item) => item._id === product._id)
    if (inWishlist) {
      await removeFromWishlist(product._id)
    } else {
      await addToWishlist(product._id)
    }
  }, [wishlist, addToWishlist, removeFromWishlist])

  const value = useMemo(
    () => ({
      cart,
      wishlist,
      loading,
      addToCart,
      removeFromCart,
      setCartQuantity,
      clearCart,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      fetchCart,
      fetchWishlist,
    }),
    [cart, wishlist, loading, addToCart, removeFromCart, setCartQuantity, clearCart, addToWishlist, removeFromWishlist, toggleWishlist, fetchCart, fetchWishlist]
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const ctx = useContext(ShopContext)
  if (!ctx) {
    throw new Error('useShop must be used within ShopProvider')
  }
  return ctx
}
