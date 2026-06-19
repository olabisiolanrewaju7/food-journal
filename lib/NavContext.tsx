'use client'

import { createContext, useContext, useState } from 'react'

const NavContext = createContext<{
  hideNav: boolean
  setHideNav: (v: boolean) => void
}>({ hideNav: false, setHideNav: () => {} })

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [hideNav, setHideNav] = useState(false)
  return <NavContext.Provider value={{ hideNav, setHideNav }}>{children}</NavContext.Provider>
}

export const useNav = () => useContext(NavContext)
