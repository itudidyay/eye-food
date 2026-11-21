// The shopping list on the kitchen wall. Saved to localStorage so it survives a refresh.

import { useEffect, useState } from 'react'
import { createId, loadShoppingList, saveShoppingList } from '../utils/storage.js'

export default function useShoppingList() {
  const [items, setItems] = useState(() => loadShoppingList())

  useEffect(() => {
    saveShoppingList(items)
  }, [items])

  function addItem(text) {
    const clean = text.trim()
    if (!clean) return
    setItems((current) => [...current, { id: createId(), text: clean, done: false }])
  }

  function toggleItem(id) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  function clearDone() {
    setItems((current) => current.filter((item) => !item.done))
  }

  return { items, addItem, toggleItem, removeItem, clearDone }
}
