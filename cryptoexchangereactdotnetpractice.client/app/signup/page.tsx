"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Check } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"   

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const prefill = searchParams.get("prefill") || ""
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [activeTab, setActiveTab] = useState<"email" | "phone">("email")
  const router = useRouter()
  const [firstName, setFirstName] = useState("") 
  const [lastName, setLastName] = useState("") 
  const [nickname, setNickname] = useState("") 
  const [password, setPassword] = useState("") 
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [agreed, setAgreed] = useState(false)


  useEffect(() => {
    if (prefill.includes("@")) { 
      setEmail(prefill)
      setActiveTab("email")
    } else if (/^\+?\d+$/.test(prefill)) {
      setPhone(prefill)
      setActiveTab("phone")
    }
  }, [prefill])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!firstName.trim() || !lastName.trim() || !nickname.trim() || !password) {
      setError("Please fill in all required fields")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    if (activeTab === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!email.trim() || !emailRegex.test(email)) {
        setError("Please enter a valid email address")
        return
      }
    } else {
      const phoneRegex = /^\+?\d{5,15}$/
      if (!phone.trim() || !phoneRegex.test(phone)) {
        setError("Please enter a valid phone number (5–15 digits, optional +)")
        return
      }
    }

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!pwdRegex.test(password)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, and a number")
      return
    }

    const payload = {
      FirstName: firstName.trim(),
      LastName:  lastName.trim(),
      Email:     activeTab === "email" ? email.trim() : null,
      Phone:     activeTab === "phone" ? phone.trim() : null,
      Username:  nickname.trim(),
      Password:  password
    }

    try {
        const res = await fetch("http://localhost:5245/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }
      const identifier = activeTab === "email" ? email : phone
      router.push(`/login?identifier=${encodeURIComponent(identifier)}&registered=true`)
    } catch (err: any) {
      console.error(err)
      setError("Registration error: " + err.message)
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white">
      <Navbar />

      <div className="max-w-md mx-auto pt-10 px-4 pb-16">
        <div className="mb-6">
          <Link href="/" className="text-gray-400 flex items-center hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-center">Create a TradeHub Account</h1>

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as "email" | "phone")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#1e2329]">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              {error && <p className="text-red-500 text-center">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="bg-[#1e2329]" />
                <Input placeholder="Last Name"  value={lastName}  onChange={e => setLastName(e.target.value)}  className="bg-[#1e2329]" />
              </div>
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="bg-[#1e2329]" />
              <Input placeholder="Nickname" value={nickname} onChange={e => setNickname(e.target.value)} className="bg-[#1e2329]" />
              <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="bg-[#1e2329]" />
              <p className="text-xs text-gray-400">
                At least 8 chars, 1 uppercase, 1 lowercase, and 1 number
              </p>
              <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-[#1e2329]" />

               <div className="flex items-center space-x-2">
                 <label className="flex items-center cursor-pointer space-x-2">
                   <input
                     type="checkbox"
                     checked={agreed}
                     onChange={e => setAgreed(e.target.checked)}
                     className="h-5 w-5 rounded bg-[#1e2329] border border-gray-600 accent-[#f0b90b] focus:ring-0"/>
                   <span className="text-xs text-gray-400">
                     I agree to TradeHub's Terms of Service and Privacy Policy
                   </span>
                 </label>
               </div>
               
               <Button
                 type="submit"
                 className="w-full bg-[#f0b90b] text-black"
                 disabled={!agreed}
               >
                 Create Account
               </Button>

            </form>
          </TabsContent>

          <TabsContent value="phone" className="mt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              {error && <p className="text-red-500 text-center">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="bg-[#1e2329]" />
                <Input placeholder="Last Name"  value={lastName}  onChange={e => setLastName(e.target.value)}  className="bg-[#1e2329]" />
              </div>
              <Input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="bg-[#1e2329]" />
              <Input placeholder="Nickname" value={nickname} onChange={e => setNickname(e.target.value)} className="bg-[#1e2329]" />
              <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="bg-[#1e2329]" />
              <p className="text-xs text-gray-400">
                At least 8 chars, 1 uppercase, 1 lowercase, and 1 number
              </p>
              <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-[#1e2329]" />

              <div className="flex items-start space-x-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="h-5 w-5 rounded bg-[#1e2329] border border-gray-600 accent-[#f0b90b] focus:ring-0"/>
                  <span className="text-xs text-gray-400">
                    I agree to TradeHub's Terms of Service and Privacy Policy
                  </span>
                </label>
              </div>

              <Button type="submit" className="w-full bg-[#f0b90b] text-black" disabled={!agreed}>
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center text-gray-400 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-[#f0b90b] hover:underline">
            Log In
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  )
}
