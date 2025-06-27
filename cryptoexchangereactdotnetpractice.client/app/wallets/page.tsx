"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface WalletDto {
  walletId: number
  coinId: number
  coinSymbol: string
  coinName: string
  coinImageUrl?: string
  coinPrice: string
  coinChange24h: string
  amount: number
}

function parseNumber(s: string): number {
  let str = s.trim()

  if (str.includes(",") && str.includes(".")) {
    str = str.replace(/,/g, "")
  } else if (str.includes(",") && !str.includes(".")) {
    str = str.replace(/,/g, ".")
  }
  str = str.replace(/[^0-9.\-]/g, "")
  const n = parseFloat(str)
  return isNaN(n) ? 0 : n
}

export default function WalletsPage() {
  const router = useRouter()
  const [wallets, setWallets] = useState<WalletDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setError("Unauthorized")
      setLoading(false)
      return
    }

      fetch("http://localhost:5245/api/wallets", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) throw new Error("Unauthorized")
        if (!res.ok) throw new Error("Failed to fetch wallets")
        return res.json() as Promise<WalletDto[]>
      })
      .then(setWallets)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        Loading your wallets…
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#0b0e11] text-white">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <Button onClick={() => router.push("/login")}>Log In</Button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">My Wallets</h1>

        {wallets.length === 0 ? (
          <p>You don’t have any wallets yet.</p>
        ) : (
          <div className="space-y-4">
            {wallets.map(w => {
              const unitPrice = parseNumber(w.coinPrice)
              const totalUSD  = unitPrice * w.amount
              const changeClass = w.coinChange24h.startsWith("-") ? "text-red-500" : "text-green-500"

              return (
                <Link
                  key={w.walletId}
                  href={`/markets/${w.coinId}`}
                  className="block hover:scale-[1.02] transition-transform duration-150"
                >
                  <div className="bg-[#1e2329] rounded-lg p-4 flex items-center cursor-pointer">
                    {w.coinImageUrl && (
                        <img src={`http://localhost:5245/${w.coinImageUrl}`}
                        alt={w.coinSymbol}
                        className="w-10 h-10 rounded-full mr-4"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h2 className="text-lg font-medium mr-2">{w.coinName}</h2>
                        <span className="text-sm text-gray-400">({w.coinSymbol})</span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Price: {w.coinPrice} (<span className={changeClass}>{w.coinChange24h}</span>)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {w.amount.toLocaleString()} {w.coinSymbol}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Total:{" "}
                        {totalUSD.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="mt-6">
          <Link href="/markets">
            <Button variant="outline">Back to Markets</Button>
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
