"use client"

import { useState, useEffect } from "react"
import { ChevronRight } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

interface Coin {
  image:     string
  symbol:    string
  name:      string
  price:     number
  change24h: number
}

export default function CryptoTable() {
  const [activeTab, setActiveTab] = useState<"popular" | "new">("popular")
  const [cryptoData, setCryptoData] = useState<Coin[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const url =
        activeTab === "popular"
          ? "http://localhost:5245/api/coins/popular?count=5"
          : "http://localhost:5245/api/coins/newListing?count=5"

      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error("Fetch error " + res.status)
        const data = (await res.json()) as Coin[]
        setCryptoData(data)
      } catch (err) {
        console.error("Failed to fetch coins:", err)
      }
    }
    fetchData()
  }, [activeTab])

  const getChangeColor = (change: number) => {
    return change < 0 ? "text-red-500" : "text-green-500"
  }

  return (
    <div className="bg-[#1e2329] rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue="popular" className="w-auto">
          <TabsList className="bg-transparent">
            <TabsTrigger
              value="popular"
              className={`text-sm ${
                activeTab === "popular" ? "text-white" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("popular")}
            >
              Popular
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className={`text-sm ${
                activeTab === "new" ? "text-white" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("new")}
            >
              New Listing
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <button className="text-xs text-gray-400 flex items-center">
          <Link href="/markets" className="hover:text-[#f0b90b]">
            View All Coins
          </Link>
          <ChevronRight className="h-3 w-3 ml-1" />
        </button>
      </div>

      <div className="space-y-4">
        {cryptoData.map((crypto, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full overflow-hidden mr-3">
                <img
                  src={`http://localhost:5245/${crypto.image}`}
                  alt={crypto.symbol}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center">
                  <span className="font-medium">{crypto.symbol}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {crypto.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-medium">
                ${crypto.price.toFixed(2)}
              </div>
              <div className={getChangeColor(crypto.change24h)}>
                {crypto.change24h > 0
                  ? "+" + crypto.change24h.toFixed(2) + "%"
                  : crypto.change24h.toFixed(2) + "%"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
