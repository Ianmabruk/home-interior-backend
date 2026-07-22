import { prisma } from '../config/database.js'

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
  return []
}

function toggleWishlist(email, productId) {
  return { wishlist: [] }
}

function getCart(email) {
  return { cart: [] }
}

function addToCart(email, productId, quantity = 1, variant) {
  return { cart: [] }
}

function removeFromCart(email, productId, variant) {
  return { cart: [] }
}

function updateCart(email, productId, quantity, variant) {
  return { cart: [] }
}

function clearCart(email) {
  return { cart: [] }
}
