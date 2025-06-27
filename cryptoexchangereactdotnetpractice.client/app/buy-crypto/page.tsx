"use client"

import React, { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, CreditCard, BanknoteIcon as Bank, ArrowRight,} from "lucide-react"
import Image from "next/image"
import Footer from "@/components/footer"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

interface Coin {
  id: number
  image: string
  symbol: string
  name: string
  price: number
  change24h: number
}

interface CoinPrice {
  symbol: string
  price: number
}

export default function BuyCryptoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlCoin = searchParams.get("coin") || ""
  const [mode, setMode] = useState<"buy" | "withdraw">("buy")
  const [symbols, setSymbols] = useState<string[]>([])
  const [selectedCrypto, setSelectedCrypto] = useState("")
  const [rate, setRate] = useState<number>(0)
  const [lastChanged, setLastChanged] = useState<"spend" | "receive">("spend")
  const [spendAmount, setSpendAmount] = useState("")
  const [receiveAmount, setReceiveAmount] = useState("")
  const [hotCoins, setHotCoins] = useState<Coin[]>([])
  const [selectedFiat, setFiat] = useState("USD")
  const fiatOptions = ["USD"]
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  useEffect(() => {
    fetch("http://localhost:5245/api/coins/symbols")
      .then((r) => r.json())
      .then((data: string[]) => {
        setSymbols(data)
        if (data.length > 0) {
          setSelectedCrypto(data.includes(urlCoin) ? urlCoin : data[0])
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedCrypto) return

    fetch(`http://localhost:5245/api/coins/price?symbol=${selectedCrypto}`)
      .then((r) => r.json())
      .then((obj: CoinPrice) => {
        setRate(obj.price)
      })
      .catch(console.error)
  }, [selectedCrypto])

  useEffect(() => {
    fetch("http://localhost:5245/api/coins/popular?count=4")
      .then((r) => r.json())
      .then((data: Coin[]) => setHotCoins(data))
      .catch(console.error)
  }, [])
  
  useEffect(() => {
    if (lastChanged === "spend") {
      const fiat = parseFloat(spendAmount)
      setReceiveAmount(
        isNaN(fiat) || rate <= 0 ? "" : (fiat / rate).toFixed(8)
      )
    } else {
      const crypto = parseFloat(receiveAmount)
      setSpendAmount(
        isNaN(crypto) || rate <= 0 ? "" : (crypto * rate).toFixed(2)
      )
    }
  }, [rate, lastChanged])

  useEffect(() => {
    if (lastChanged !== "spend") return
    const fiat = parseFloat(spendAmount)
    setReceiveAmount(
      isNaN(fiat) || rate <= 0 ? "" : (fiat / rate).toFixed(8)
    )
  }, [spendAmount, rate, lastChanged])

  useEffect(() => {
    if (lastChanged !== "receive") return
    const crypto = parseFloat(receiveAmount)
    setSpendAmount(
      isNaN(crypto) || rate <= 0 ? "" : (crypto * rate).toFixed(2)
    )
  }, [receiveAmount, rate, lastChanged])
  
  const getChangeColor = (chg: number) => chg < 0 ? "text-red-500" : "text-green-500"

  const handleTransaction = async () => {
    setError("")
    setSuccess("")
    const type = mode
    const amount = parseFloat(receiveAmount)
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(
        "http://localhost:5245/api/wallets/buyCrypto",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ symbol: selectedCrypto, amount, price: rate, type }),
        }
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Transaction failed (Unauthorized)")
      }
      setSuccess(type === "buy" ? `Bought ${amount} ${selectedCrypto}` : `Withdrew ${amount} ${selectedCrypto}`)
      setSpendAmount("")
      setReceiveAmount("")
      setTimeout(() => setSuccess(""), 5000)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Something went wrong")
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Buy / Withdraw Crypto</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-[#1e2329] rounded-lg p-6 mb-8">
              <Tabs
                defaultValue="buy"
                onValueChange={(v) => setMode(v === "buy" ? "buy" : "withdraw")}
                className="w-full mb-6"
              >
                <TabsList className="bg-[#2b3139] p-1 rounded-lg">
                  <TabsTrigger value="buy" className="rounded-md">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Buy
                  </TabsTrigger>
                  <TabsTrigger value="withdraw" className="rounded-md">
                    <Bank className="h-4 w-4 mr-2" />
                    Withdraw
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mode === "buy" ? (
                  <>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">
                        Spend
                      </label>
                      <div className="flex">
                        <Input
                          type="text"
                          placeholder="0.00"
                          value={spendAmount}
                          onChange={(e) => {
                            setLastChanged("spend")
                            setSpendAmount(e.target.value)
                          }}
                          className="bg-[#2b3139] border-gray-700 text-white rounded-r-none"
                        />
                        <div className="relative">
                          <select
                            value={selectedFiat}
                            onChange={(e) => setFiat(e.target.value)}
                            className="appearance-none bg-[#2b3139] border border-gray-700 text-white px-3 py-2 rounded-l-none pr-8"
                          >
                            {fiatOptions.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">
                        Receive
                      </label>
                      <div className="flex">
                        <Input
                          type="text"
                          placeholder="0.00000000"
                          value={receiveAmount}
                          onChange={(e) => {
                            setLastChanged("receive")
                            setReceiveAmount(e.target.value)
                          }}
                          className="bg-[#2b3139] border-gray-700 text-white rounded-r-none"
                        />
                        <div className="relative">
                          <select
                            value={selectedCrypto}
                            onChange={(e) => {
                              setLastChanged("spend")
                              setSelectedCrypto(e.target.value)
                            }}
                            className="appearance-none bg-[#2b3139] border border-gray-700 text-white px-3 py-2 rounded-l-none pr-8"
                          >
                            {symbols.map((sym) => (
                              <option key={sym} value={sym}>
                                {sym}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">
                        Receive
                      </label>
                      <div className="flex">
                        <Input
                          type="text"
                          placeholder="0.00000000"
                          value={receiveAmount}
                          onChange={(e) => {
                            setLastChanged("receive")
                            setReceiveAmount(e.target.value)
                          }}
                          className="bg-[#2b3139] border-gray-700 text-white rounded-r-none"
                        />
                        <div className="relative">
                          <select
                            value={selectedCrypto}
                            onChange={(e) => {
                              setLastChanged("receive")
                              setSelectedCrypto(e.target.value)
                            }}
                            className="appearance-none bg-[#2b3139] border border-gray-700 text-white px-3 py-2 rounded-l-none pr-8"
                          >
                            {symbols.map((sym) => (
                              <option key={sym} value={sym}>
                                {sym}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">
                        Spend
                      </label>
                      <div className="flex">
                        <Input
                          type="text"
                          placeholder="0.00"
                          value={spendAmount}
                          onChange={(e) => {
                            setLastChanged("spend")
                            setSpendAmount(e.target.value)
                          }}
                          className="bg-[#2b3139] border-gray-700 text-white rounded-r-none"
                        />
                        <div className="relative">
                          <select
                            value={selectedFiat}
                            onChange={(e) => setFiat(e.target.value)}
                            className="appearance-none bg-[#2b3139] border border-gray-700 text-white px-3 py-2 rounded-l-none pr-8"
                          >
                            {fiatOptions.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6">
                <Button className="w-full bg-[#f0b90b] hover:bg-[#d9a520] text-black font-medium py-6" onClick={handleTransaction}>
                  {mode === "buy" ? `Buy ${selectedCrypto}` : `Withdraw ${selectedCrypto}`}
                </Button>
              </div>

              {error && (
                <p className="text-red-500 text-center mb-4">{error}</p>
              )}
              {success && (
                <p className="text-green-500 text-center mb-4">{success}</p>
              )}
            </div>
          </div>

          <div>
            <div className="bg-[#1e2329] rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Hot Cryptos</h2>
              <div className="space-y-4">
                {hotCoins.map((coin, idx) => (
                  <Link key={idx} href={`/markets/${coin.id}`} className="block">
                    <div className="flex items-center justify-between hover:bg-[#2b3139] p-2 rounded-lg cursor-pointer">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                          <img src={`http://localhost:5245/${coin.image}`} alt={coin.symbol} width={32} height={32}/>
                        </div>
                        <div>
                          <div className="font-medium">{coin.symbol}</div>
                          <div className="text-xs text-gray-400">{coin.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ${coin.price.toFixed(2)}
                        </div>
                        <div className={`${getChangeColor(coin.change24h)} text-xs`}>
                          {coin.change24h > 0 ? "+" + coin.change24h.toFixed(2) + "%" : coin.change24h.toFixed(2) + "%"}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-500 ml-2" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
