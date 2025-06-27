"use client"

import Image from "next/image"
import Link from "next/link"
import { Search, User, Wallet, X} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Navbar() { 
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem("user")
      if (raw) setUser(JSON.parse(raw))
    } catch (err) {
      console.warn("Navbar: invalid user in localStorage:", err)
    }
  }, [])

    useEffect(() => {
        if (searchOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [searchOpen])

    const onSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return
        router.push(`/markets?search=${encodeURIComponent(query.trim())}`)
        setSearchOpen(false)
        setQuery("")
    }

  const logout = () => {                         
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    router.push("/")
  }

  return (
    <nav className="border-b border-gray-800 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <Link href="/" className="mr-6">
          <Image
            src="/logo.png"
            height={0}
            width={0}
            alt="TradeHub Logo"
            className="h-12 w-auto"
            sizes="100vw"
            priority
          />
        </Link>
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/buy-crypto" className="text-sm font-medium hover:text-[#f0b90b]">
            Buy Crypto
          </Link>
          <Link href="/markets" className="text-sm font-medium hover:text-[#f0b90b]">
            Markets
          </Link>
          <Link href="/trade" className="text-sm font-medium hover:text-[#f0b90b]">
            Trade
          </Link>
          <Link href="/news" className="text-sm font-medium hover:text-[#f0b90b]">
            News
          </Link>
          {mounted && user?.role === "admin" && (
            <Link href="/admin" className="text-sm font-medium hover:text-[#f0b90b]">
              Admin
            </Link>
          )}
        </div>
      </div>

        <div className="flex items-center space-x-4">
        {searchOpen ? (
          <form onSubmit={onSearchSubmit} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search coins…"
              className="bg-[#1e2329] text-white rounded px-3 py-1 w-48 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="absolute right-0 top-0 mt-1 mr-1 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4"/>
            </button>
          </form>
        ) : (
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setSearchOpen(true)}
            title="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        )}

        {mounted && user ? (
          <>
            <button
              className="text-gray-400 hover:text-white"
              onClick={() => router.push("/wallets")}
              title="My Wallets"
            >
              <Wallet className="h-5 w-5" />
            </button>

            <div className="relative">
              <User
                className="h-5 w-5 cursor-pointer text-gray-400 hover:text-white"
                onClick={() => setMenuOpen(o => !o)}
              />
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0b0e11] text-white p-4 rounded shadow-lg z-10">
                  <p className="font-medium">{user.username}</p>
                  <p>{user.firstName} {user.lastName}</p>
                  <p className="text-sm">{user.email || user.phone}</p>
                  <p className="text-xs text-gray-400">Role: {user.role}</p>
                  <Button variant="outline" className="mt-2 w-full" onClick={logout}>
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm font-medium hover:text-[#f0b90b]">
              Log In
            </Link>
            <Link href="/signup">
              <Button className="bg-[#f0b90b] text-black rounded-md text-sm px-4 py-2">
                Sign Up
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
