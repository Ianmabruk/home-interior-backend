/* eslint-disable react-hooks/set-state-in-effect, react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { CURRENCIES, EXCHANGE_RATES } from '../utils/constants'
import { api } from '../services/api'

const CurrencyContext = createContext(null)

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('USD')

  useEffect(() => {
    const saved = localStorage.getItem('hok_currency')
    if (saved && CURRENCIES.some((c) => c.code === saved)) {
      setCurrency(saved)
    } else {
      api.get('/admin/settings').then((res) => {
        if (res.data?.currency) setCurrency(res.data.currency)
      }).catch(() => {})
    }
  }, [])

  const changeCurrency = useCallback((newCurrency) => {
    setCurrency(newCurrency)
    localStorage.setItem('hok_currency', newCurrency)
  }, [])

  const formatPrice = useCallback((amount) => {
    const rate = EXCHANGE_RATES[currency] || 1
    const converted = Math.round(amount * rate)
    const currencyObj = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]

    if (currency === 'KES') {
      return `${currencyObj.symbol} ${converted.toLocaleString()}`
    }
    return `${currencyObj.symbol}${converted.toLocaleString()}`
  }, [currency])

  const value = {
    currency,
    currencies: CURRENCIES,
    changeCurrency,
    formatPrice,
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return ctx
}