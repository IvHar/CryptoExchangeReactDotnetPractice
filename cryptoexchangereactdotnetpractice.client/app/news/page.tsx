"use client"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Calendar, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"

interface Article {
    title: string
    description: string
    publishedAt: string
    url: string
    urlToImage: string
    source: { name: string }
}

export default function NewsPage() {
    const [articles, setArticles] = useState<Article[]>([])
    const [activeTab, setActiveTab] = useState<"all" | "market" | "tech" | "regulation">("all")
    const [inputValue, setInputValue] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true)
            setError(null)
            const baseQuery = "cryptocurrency"
            const tabFilter = activeTab === "all" ? "" : activeTab === "market" ? " market" : activeTab === "tech" ? " technology" : " regulation"
            const query = `${baseQuery}${tabFilter}${searchTerm ? ` ${searchTerm}` : ""}`
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
                query
            )}&language=en&sortBy=publishedAt&pageSize=12&apiKey=${apiKey}`

            try {
                const res = await fetch(url)
                if (res.status === 401) {
                    setError("Unauthorized: invalid API key or rate limit exceeded.")
                    setArticles([])
                } else if (!res.ok) {
                    setError(`Error: ${res.status} ${res.statusText}`)
                    setArticles([])
                } else {
                    const data = await res.json()
                    setArticles(data.articles || [])
                }
            } catch (err) {
                setError("Network error while fetching news.")
            } finally {
                setLoading(false)
            }
        }

        fetchNews()
    }, [activeTab, searchTerm, apiKey])

    const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            setSearchTerm(inputValue.trim())
        }
    }

     return (
    <main className="min-h-screen bg-[#0b0e11] text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Crypto News</h1>

        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="bg-[#1e2329] p-1 rounded-lg">
              <TabsTrigger value="all" className="rounded-md">All News</TabsTrigger>
              <TabsTrigger value="market" className="rounded-md">Market</TabsTrigger>
              <TabsTrigger value="tech" className="rounded-md">Technology</TabsTrigger>
              <TabsTrigger value="regulation" className="rounded-md">Regulation</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search news"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleSearchKey}
              className="pl-10 bg-[#1e2329] border-gray-700 text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((article, idx) => (
              <div key={idx} className="bg-[#1e2329] rounded-lg overflow-hidden">
                <Image
                  src={article.urlToImage || "/placeholder.svg"}
                  width={350}
                  height={200}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center text-xs text-gray-400 mb-2">
                    <span className="text-[#f0b90b] mr-2">{article.source.name}</span>
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString()} •{' '}
                      {new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="font-bold mb-2">{article.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">{article.description}</p>
                  <Link
                    href={article.url}
                    target="_blank"
                    className="text-sm text-[#f0b90b] flex items-center hover:underline"
                  >
                    Read more <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
