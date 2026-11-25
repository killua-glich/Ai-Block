import { useEffect, useState } from 'react'
import builtIn from './devices.js'
import { fetchDevices } from './api.js'

// The page shows the built-in list at once, and swaps in the list from the database when it arrives.
// When the server cannot be reached, the built-in list stays.
let latest = builtIn

export function resetDevices() {
  latest = builtIn
}

export function useDevices() {
  const [devices, setDevices] = useState(latest)

  useEffect(() => {
    let isActive = true
    fetchDevices()
      .then((list) => {
        latest = list
        if (isActive) setDevices(list)
      })
      .catch(() => {})
    return () => {
      isActive = false
    }
  }, [])

  return devices
}
