"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react"
import Link from "next/link"

interface FAQItem {
  id: number
  question: string
  answer: React.ReactNode
}

export default function FAQSection() {
  const [openItem, setOpenItem] = useState<number | null>(null)

  const toggleItem = (id: number) => {
    setOpenItem(openItem === id ? null : id)
  }

  const faqItems: FAQItem[] = [
    {
      id: 1,
      question: "What is TradeHub and why did I build it?",
      answer: (
        <div className="space-y-4">
          <p>
            TradeHub is a cryptocurrency exchange project developed as a hands-on learning platform to simulate how real-world trading platforms like Binance operate.
          </p>
          <p>
            The project covers key functionalities such as user authentication, order placing, spot trading, real-time updates, and a modern UI.
          </p>
        </div>
      ),
    },
    {
      id: 2,
        question: "What technologies power TradeHub?",
      answer: (
        <div className="space-y-4">
          <p>TradeHub is built using a modern full-stack tech stack:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Frontend: React, Next.js, Tailwind CSS, TypeScript</li>
            <li>Backend: ASP.NET</li>
            <li>Database: Microsoft SQL Server</li>
          </ul>
          <p>
            Moreover, TradeHub uses Electron to create a desktop application, allowing users to run the app locally on their machines.
          </p>
        </div>
      ),
    },
      {
          id: 3,
          question: "How does trading work in this project?",
          answer: (
              <div className="space-y-4">
                  <p>
                      Users can create buy or sell orders. When a matching order is found, a trade is executed automatically.
                  </p>
                  <p>
                      The logic for order matching is written in the backend and runs synchronously for now, but could be decoupled with message queues in future versions.
                  </p>
              </div>
          ),
      },
      {
          id: 4,
          question: "How is user authentication secured?",
          answer: (
              <div className="space-y-4">
                  <p>
                      Authentication is implemented using JWT tokens. The server issues a token after successful login or registration, and this token is stored client-side to access protected routes.
                  </p>
                  <p>
                      Role-based access control is also supported for admin and regular user permissions.
                  </p>
              </div>
          ),
      },
      {
          id: 5,
          question: "What are the next planned features for TradeHub?",
          answer: (
              <div className="space-y-4">
                  <p>Planned features include:</p>
                  <ul className="list-disc pl-5 space-y-2">
                      <li>KYC flow with file upload and verification</li>
                      <li>Futures trading simulation with leverage</li>
                      <li>Dark/light theme toggle</li>
                      <li>Full mobile responsiveness</li>
                      <li>Admin dashboard for listing coins and managing users</li>
                  </ul>
              </div>
          ),
      },
      {
          id: 6,
          question: "GitHub and User Guide",
          answer: (
              <div className="space-y-4">
                  <a href="https://github.com/IvHar/CryptoExchangeReactDotnetPractice">Link to Github</a>
              </div>
          ),
      },
  ]

  return (
    <section className="py-10 px-4 md:px-8 lg:px-16 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>

        <div className="space-y-4">
          {faqItems.map((item) => (
            <div key={item.id} className="bg-[#1e2329] rounded-lg overflow-hidden">
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 bg-[#2b3139] rounded-full mr-4 text-sm">
                    {item.id}
                  </span>
                  <h3 className="text-lg font-medium">{item.question}</h3>
                </div>
                {openItem === item.id ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {openItem === item.id && (
                <div className="px-5 pb-5 pt-0">
                  <div className="pl-12 text-gray-300">{item.answer}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
