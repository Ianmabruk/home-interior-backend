/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useCallback, useState, useRef } from 'react'
import { api } from '../services/api'
import { useAuth } from './AuthContext'

const ShopContext = createContext(null)

export const ShopProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState([])
  const [wishlist, setWishlist] = useState([])
  const prevAuthRef = useRef(isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCart([])
      setWishlist([])
      prevAuthRef.current = false
      return
    }
    if (!prevAuthRef.current && isAuthenticated) {
      Promise.all([api.get('/users/wishlist'), api.get('/users/cart')])
        .then(([wishlistRes, cartRes]) => {
          setWishlist(wishlistRes.data?.products || [])
          const mappedCart = (cartRes.data?.items || []).map((entry) => ({
            ...entry,
            quantity: entry.quantity,
            selectedVariant: entry.selectedVariant || null,
          }))
          setCart(mappedCart)
        })
        .catch(() => {
          setWishlist([])
          setCart([])
        })
    }

    prevAuthRef.current = true
  }, [isAuthenticated])

  const addToCart = useCallback((product, quantity = 1, variant = null) => {
    const selectedVariant = variant ? { colorName: variant.colorName, colorHex: variant.colorHex, imageUrl: variant.imageUrl } : null

    if (isAuthenticated) {
      api.post('/users/cart', { productId: product._id, quantity, variant: selectedVariant }).then((res) => {
        const mapped = (res.data?.items || []).map((entry) => ({ ...entry, quantity: entry.quantity, selectedVariant: entry.selectedVariant || null }))
        setCart(mapped)
      }).catch(() => {})
    }

    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id && item.selectedVariant?.colorName === selectedVariant?.colorName)
      if (existing) {
        return prev.map((item) =>
          item._id === product._id && item.selectedVariant?.colorName === selectedVariant?.colorName
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }
      return [...prev, { ...product, quantity, selectedVariant }]
    })
  }, [isAuthenticated])

  const removeFromCart = useCallback((productId, variant = null) => {
    const selectedVariant = variant ? { colorName: variant.colorName } : null

    if (isAuthenticated) {
      const params = selectedVariant?.colorName ? `?colorName=${encodeURIComponent(selectedVariant.colorName)}` : ''
      api.delete(`/users/cart/${productId}${params}`).then((res) => {
        const mapped = (res.data?.items || []).map((entry) => ({ ...entry, quantity: entry.quantity, selectedVariant: entry.selectedVariant || null }))
        setCart(mapped)
      }).catch(() => {})
    }

    setCart((prev) => prev.filter((item) => !(item._id === productId && item.selectedVariant?.colorName === selectedVariant?.colorName)))
  }, [isAuthenticated])

  const setCartQuantity = useCallback((productId, quantity, variant = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant)
      return
    }

    const selectedVariant = variant ? { colorName: variant.colorName } : null

    if (isAuthenticated) {
      api.patch('/users/cart', { productId, quantity, variant: selectedVariant }).then((res) => {
        const mapped = (res.data?.items || []).map((entry) => ({ ...entry, quantity: entry.quantity, selectedVariant: entry.selectedVariant || null }))
        setCart(mapped)
      }).catch(() => {})
    }

    setCart((prev) => prev.map((item) => (item._id === productId && item.selectedVariant?.colorName === selectedVariant?.colorName ? { ...item, quantity } : item)))
  }, [isAuthenticated, removeFromCart])

  const toggleWishlist = useCallback((product) => {
    if (isAuthenticated) {
      api.post('/users/wishlist/toggle', { productId: product._id }).then((res) => {
        setWishlist(res.data?.products || [])
      }).catch(() => {})
    }

    setWishlist((prev) => {
      const exists = prev.find((item) => item._id === product._id)
      return exists ? prev.filter((item) => item._id !== product._id) : [...prev, product]
    })
  }, [isAuthenticated])

  const clearCart = useCallback(() => setCart([]), [])
  const value = useMemo(
    () => ({
      cart,
      wishlist,
      addToCart,
      removeFromCart,
      setCartQuantity,
      toggleWishlist,
      clearCart,
      cartTotal: cart.reduce((sum, item) => {
        const price = item.selectedVariant?.priceOverride || item.price
        return sum + price * item.quantity
      }, 0),
    }),
    [cart, wishlist, addToCart, removeFromCart, setCartQuantity, toggleWishlist, clearCart],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export const useShop = () => {
  const ctx = useContext(ShopContext)
  if (!ctx) {
    throw new Error('useShop must be used within ShopProvider')
  }
  return ctx
}
