"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {Tabs, TabsContent, TabsList, TabsTrigger,} from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const prefill = searchParams.get("identifier") ?? ""
    const registered = searchParams.get("registered")

    const [emailId, setEmailId] = useState("")
    const [phoneId, setPhoneId] = useState("")
    const [tab, setTab] = useState<"email" | "phone">("email")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [successMsg, setSuccessMsg] = useState("")

    useEffect(() => {
        if (registered) {
            setSuccessMsg("User registered successfully")
            const t = setTimeout(() => setSuccessMsg(""), 5000)
            return () => clearTimeout(t)
        }
    }, [registered])

    useEffect(() => {
        if (!prefill) return
        if (prefill.includes("@")) {
            setEmailId(prefill)
            setTab("email")
        } else {
            setPhoneId(prefill)
            setTab("phone")
        }
    }, [prefill])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        const identifier = tab === "email" ? emailId : phoneId

        if (tab === "email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(emailId.trim())) {
                setError("Please enter a valid email address")
                return
            }
        } else {
            const phoneRegex = /^\+?\d{5,15}$/
            if (!phoneRegex.test(phoneId.trim())) {
                setError("Please enter a valid phone number (5–15 digits, optional +)")
                return
            }
        }

        if (!identifier.trim() || !password) {
            setError("Please fill in both identifier and password")
            return
        }

        const res = await fetch("http://localhost:5245/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password }),
        })

        if (!res.ok) {
            const msg = await res.text()
            setError(msg || "Login failed")
            return
        }

        const { token, user } = await res.json()
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(user))
        router.push("/markets")
    }

    return (
        <main className="min-h-screen bg-[#0b0e11] text-white">
            <Navbar />

            <div className="max-w-md mx-auto pt-10 px-4">
                <div className="mb-6">
                    <Link
                        href="/"
                        className="text-gray-400 flex items-center hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Link>
                </div>

                <h1 className="text-2xl font-bold mb-6 text-center">Log In</h1>

                <Tabs
                    value={tab}
                    onValueChange={(v) => {
                        setTab(v as "email" | "phone")
                        setError("")
                    }}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2 bg-[#1e2329]">
                        <TabsTrigger value="email">Email</TabsTrigger>
                        <TabsTrigger value="phone">Phone</TabsTrigger>
                    </TabsList>

                    {successMsg && (
                        <p className="text-green-500 text-center mt-4">{successMsg}</p>
                    )}
                    {error && (
                        <p className="text-red-500 text-center mt-2">{error}</p>
                    )}

                    <TabsContent value="email" className="mt-6">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input
                                type="email"
                                placeholder="Email"
                                className="bg-[#1e2329] border-gray-700 text-white"
                                value={emailId}
                                onChange={(e) => setEmailId(e.target.value)}
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                className="bg-[#1e2329] border-gray-700 text-white"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Button className="w-full bg-[#f0b90b] text-black">
                                Log In
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="phone" className="mt-6">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input
                                type="tel"
                                placeholder="Phone Number"
                                className="bg-[#1e2329] border-gray-700 text-white"
                                value={phoneId}
                                onChange={(e) => setPhoneId(e.target.value)}
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                className="bg-[#1e2329] border-gray-700 text-white"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Button className="w-full bg-[#f0b90b] text-black">
                                Log In
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>

                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-[#f0b90b] hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
            <Footer />
        </main>
    )
}
