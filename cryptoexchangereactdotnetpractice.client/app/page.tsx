"use client"

import Image from "next/image"
import Link from "next/link"
import { Search, ChevronDown, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import CryptoTable from "@/components/crypto-table"
import FAQSection from "@/components/faq-section"
import Footer from "@/components/footer"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"

export default function Home() {
    const [inputValue, setInputValue] = useState("")
    const router = useRouter()

    const handleJoinDemo = () => {
        const encoded = encodeURIComponent(inputValue.trim())
        if (encoded) {
            router.push(`/signup?prefill=${encoded}`)
        } else {
            router.push("/signup")
        }
    }
  return (
    <main className="min-h-screen bg-[#0b0e11] text-white">
      <Navbar /> 

      <section className="py-16 px-4 md:px-8 lg:px-16 flex flex-col md:flex-row">
        <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-5xl md:text-7xl font-bold text-[#f0b90b]">Welcome to TradeHub</h1>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-400 mt-2">Learn. Build. Trade.</h2>

          <div className="mt-10 max-w-md">
            <div className="flex">
              <input
                type="text"
                placeholder="Email/Phone number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="h-12 flex-1 bg-[#1e2329] border border-gray-700 rounded-l-md px-4 py-3 text-sm focus:outline-none focus:border-[#f0b90b]"
              />
              <Button onClick={handleJoinDemo} className="h-12 bg-[#f0b90b] hover:bg-[#d9a520] text-black font-medium rounded-r-md text-sm px-6">
                Join the Demo
              </Button>
            </div>
          </div>
        </div>

        <div className="md:w-1/2">
          <CryptoTable />
        </div>
      </section>

      <FAQSection />
      <Footer />
    </main>
  )
}
