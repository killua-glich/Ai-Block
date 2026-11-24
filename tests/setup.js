import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  // The server tests run in the node environment, where there is no localStorage.
  if (typeof localStorage !== 'undefined') localStorage.clear()
})
