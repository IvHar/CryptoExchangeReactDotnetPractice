"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Share } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import CandleChart from "../../../components/candle-chart"

interface CoinDto {
  id: number
  image: string
  symbol: string
  name: string
  capitalization: number
}

interface TickerDto {
  price: number
  change24h: number
}

interface CandleDto {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export default function CoinDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const coinId = parseInt(params.id, 10)
  const [coin, setCoin] = useState<CoinDto | null>(null)
  const [loadingCoin, setLoadingCoin] = useState(true)
  const [ticker, setTicker] = useState<TickerDto | null>(null)
  const [loadingTicker, setLoadingTicker] = useState(true)
  const [candles, setCandles] = useState<CandleDto[]>([])
  const [loadingCandles, setLoadingCandles] = useState(true)
  const [interval, setInterval] = useState<"1m" | "5m" | "15m" | "1h" | "4h" | "1d">("1h")
  const [volume24h, setVolume24h] = useState<number>(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLoadingCoin(true)
      fetch(`http://localhost:5245/api/coins/${coinId}`)
      .then((res) => {
        if (res.status === 404) throw new Error("Not found")
        return res.json() as Promise<CoinDto>
      })
      .then((data) => setCoin(data))
      .catch(() => setCoin(null))
      .finally(() => setLoadingCoin(false))
  }, [coinId])

  const loadTicker = useCallback(() => {
    if (!coin) return

    setLoadingTicker(true)
    const base = coin.symbol
    const quote = "USDT"

    fetch(
      `http://localhost:5245/api/markets/${base}/${quote}/ticker`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Ticker not found")
        return res.json() as Promise<TickerDto>
      })
      .then((data) => setTicker(data))
      .catch(() => setTicker(null))
      .finally(() => setLoadingTicker(false))
  }, [coin])
  
  const loadCandles = useCallback(() => {
    if (!coin) return

    setLoadingCandles(true)
    const base = coin.symbol
    const quote = "USDT"

    fetch(
      `http://localhost:5245/api/markets/${base}/${quote}/candles?interval=${interval}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Candles not found")
        return res.json() as Promise<CandleDto[]>
      })
      .then((data) => {
        setCandles(data)

        const now = new Date()
        const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

        let volSum = 0
        if (interval === "1h") {
          const last24 = data.slice(-24)
          volSum = last24.reduce((sum, c) => sum + c.volume, 0)
        } else {
          data.forEach((c) => {
            const ts = new Date(c.timestamp)
            if (ts >= since24h) {
              volSum += c.volume
            }
          })
        }
        setVolume24h(volSum)
      })
      .catch(() => {
        setCandles([])
        setVolume24h(0)
      })
      .finally(() => setLoadingCandles(false))
  }, [coin, interval])

  useEffect(() => {
    if (coin) {
      loadTicker()
      loadCandles()
    }
  }, [coin, loadTicker, loadCandles])

  useEffect(() => {
    if (coin) {
      loadCandles()
    }
  }, [interval, coin, loadCandles])
  
  const handleShare = useCallback(() => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  if (loadingCoin) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white bg-[#0b0e11]">
        Loading…
      </main>
    )
  }
  if (!coin) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center text-white bg-[#0b0e11]">
        <p className="mb-4">Coin #{coinId} not found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <nav className="text-sm text-gray-400">
          <Link href="/" className="hover:text-white">
            Home
          </Link>{" "}
          ›{" "}
          <Link href="/markets" className="hover:text-white">
            Markets
          </Link>{" "}
          › <span>{coin.name} ({coin.symbol})</span>
        </nav>

        <section className="bg-[#1e2329] rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            {coin.image && (
              <img
                src={`http://localhost:5245/${coin.image}`}
                alt={coin.symbol}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {coin.name} ({coin.symbol})
              </h1>
              {loadingTicker || !ticker ? (
                <p className="text-gray-400">Loading price…</p>
              ) : (
                <p className="text-gray-400">
                  Price: {ticker.price.toFixed(8)} USDT{" "}
                  <span
                    className={
                      ticker.change24h < 0
                        ? "text-red-500"
                        : "text-green-500"
                    }
                  >
                    {ticker.change24h < 0 ? "" : "+"}
                    {ticker.change24h.toFixed(2)}%
                  </span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 border border-gray-700 px-3 py-1 rounded hover:bg-gray-800 transition"
          >
            <Share className="h-4 w-4" />
            <span>{copied ? "Copied!" : "Share"}</span>
          </button>
        </section>

        <section className="bg-[#1e2329] rounded-lg p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <dt className="text-gray-400 text-sm">Current Price</dt>
            <dd className="font-medium">
              {loadingTicker || !ticker
                ? "—"
                : `${ticker.price.toFixed(8)} USDT`}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400 text-sm">24h Change</dt>
            <dd
              className={`font-medium ${
                ticker && ticker.change24h < 0
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {loadingTicker || !ticker
                ? "—"
                : `${ticker.change24h < 0 ? "" : "+"}${ticker.change24h.toFixed(2)}%`}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400 text-sm">24h Volume</dt>
            <dd className="font-medium">
              {loadingCandles ? "—" : volume24h.toFixed(4)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400 text-sm">Market Cap</dt>
            <dd className="font-medium">
              ${coin.capitalization.toLocaleString()}
            </dd>
          </div>
        </section>

        <section className="bg-[#1e2329] rounded-lg p-6">
          <div className="mb-4">
            <Tabs defaultValue={interval}>
              <TabsList className="grid grid-cols-6 gap-2">
                {["1m", "5m", "15m", "1h", "4h", "1d"].map((intv) => (
                  <TabsTrigger
                    key={intv}
                    value={intv}
                    onClick={() => setInterval(intv as any)}
                    className={ interval === intv ? "bg-gray-700 text-white" : "bg-gray-600 text-gray-300"}>
                    {intv}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="h-80">
            {loadingCandles ? (
              <div className="flex items-center justify-center h-full">
                Loading chart…
              </div>
            ) : (
              <CandleChart
                base={coin.symbol}
                quote="USDT"
                interval={interval}
                height={320}
                width="100%"
              />
            )}
          </div>
        </section>

        <section className="flex flex-col md:flex-row gap-4">
          <Link href={`/buy-crypto?coin=${coin.symbol}`} className="w-full">
            <button
              className="
                w-full  
                bg-gradient-to-r from-yellow-400 to-yellow-600
                hover:from-yellow-500 hover:to-yellow-700
                text-black font-semibold
                py-3
                rounded-lg
                shadow-lg
                transform transition-transform duration-200 ease-out
                hover:scale-105 active:scale-95">
              Buy {coin.symbol}
            </button>
          </Link>
          <Link href={`/trade?symbol=${coin.symbol}USDT`} className="w-full">
            <button className="
                w-full 
                bg-gradient-to-r from-gray-700 to-gray-900
                hover:from-gray-600 hover:to-gray-800
                text-white font-semibold
                py-3
                rounded-lg
                shadow-lg
                transform transition-transform duration-200 ease-out
                hover:scale-105 active:scale-95">
              Trade {coin.symbol}/USDT
            </button>
          </Link>
        </section>
      </div>

      <Footer />
    </main>
  )
}
