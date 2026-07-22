
const cartStore = new Map()
const wishlistStore = new Map()

function getCartKey(email) {
  return `cart:${email}`
}

function getWishlistKey(email) {
  return `wishlist:${email}`
}

export const userService = {
  getWishlist,
  toggleWishlist,
  getCart,
  addToCart,
  removeFromCart,
  updateCart,
  clearCart,
}

function getWishlist(email) {
  const key = getWishlistKey(email)
  if (!wishlistStore.has(key)) {
    wishlistStore.set(key, [])
  }
  return wishlistStore.get(key)
}

function toggleWishlist(email, productId) {
  const key = getWishlistKey(email)
  const current = wishlistStore.get(key) || []
  const exists = current.some((item) => item._id === productId || item.id === productId)
  const updated = exists
    ? current.filter((item) => item._id !== productId && item.id !== productId)
    : [...current, { _id: productId, id: productId }]
  wishlistStore.set(key, updated)
  return { products: updated }
}

function getCart(email) {
  const key = getCartKey(email)
  if (!cartStore.has(key)) {
    cartStore.set(key, [])
  }
  return { items: cartStore.get(key) || [] }
}

function addToCart(email, productId, quantity = 1, variant) {
  const key = getCartKey(email)
  const current = cartStore.get(key) || []
  const selectedVariant = variant || null
  const existing = current.find(
    (item) => (item._id === productId || item.id === productId) && item.selectedVariant?.colorName === selectedVariant?.colorName,
  )
  let updated
  if (existing) {
    updated = current.map((item) =>
      (item._id === productId || item.id === productId) && item.selectedVariant?.colorName === selectedVariant?.colorName
        ? { ...item, quantity: item.quantity + quantity }
        : item,
    )
  } else {
    updated = [...current, { _id: productId, id: productId, quantity, selectedVariant }]
  }
  cartStore.set(key, updated)
  return { items: updated }
}

function removeFromCart(email, productId, variant) {
  const key = getCartKey(email)
  const selectedVariant = variant || null
  const current = cartStore.get(key) || []
  const updated = current.filter(
    (item) => !((item._id === productId || item.id === productId) && item.selectedVariant?.colorName === selectedVariant?.colorName),
  )
  cartStore.set(key, updated)
  return { items: updated }
}

function updateCart(email, productId, quantity, variant) {
  const key = getCartKey(email)
  const selectedVariant = variant || null
  const current = cartStore.get(key) || []
  if (quantity <= 0) {
    return removeFromCart(email, productId, variant)
  }
  const updated = current.map((item) =>
    (item._id === productId || item.id === productId) && item.selectedVariant?.colorName === selectedVariant?.colorName
      ? { ...item, quantity }
      : item,
  )
  cartStore.set(key, updated)
  return { items: updated }
}

function clearCart(email) {
  const key = getCartKey(email)
  cartStore.set(key, [])
  return { items: [] }
}
