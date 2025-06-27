"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const isAdmin = true

export default function AdminProtected({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) {
      router.push("/login")
    } else {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#f0b90b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Verifying admin access...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
