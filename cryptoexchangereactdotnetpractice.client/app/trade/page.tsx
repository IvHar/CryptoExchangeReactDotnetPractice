"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Tabs, TabsList, TabsTrigger, TabsContent,} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CandleChart from "@/components/candle-chart";

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface Ticker {
  currentPrice: number;
  change24h: number;
}

interface OrderBookDto {
  buys: { price: number; amount: number; total: number }[];
  sells: { price: number; amount: number; total: number }[];
}

interface OpenOrder {
  id: number;
  pair: string;
  type: "buy" | "sell";
  status: "open" | "fulfilled" | "cancelled";
  price: number;
  amount: number;
  total: number;
}

function getJwtToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

export default function TradePage() {
  const searchParams = useSearchParams();
  const symbolParam = searchParams.get("symbol") || "";
  const [coins, setCoins] = useState<string[]>([]);
  const [base, setBase] = useState<string>("");
  const [quote, setQuote] = useState<string>("");

  const [orderBook, setOrderBook] = useState<{
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
  }>({ bids: [], asks: [] });

  const [ticker, setTicker] = useState<Ticker>({ currentPrice: 0, change24h: 0 });
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [myOrders, setMyOrders] = useState<OpenOrder[]>([]);
  const [interval, setInterval] = useState<"1m" | "5m" | "15m" | "1h" | "4h" | "1d">("1h");
  const total = price !== "" && amount !== "" ? (parseFloat(price) * parseFloat(amount)).toFixed(8) : "";

  useEffect(() => {
    if (!symbolParam) return;
    const quoteLen = 4;
    if (symbolParam.length > quoteLen) {
      setBase(symbolParam.slice(0, symbolParam.length - quoteLen));
      setQuote(symbolParam.slice(symbolParam.length - quoteLen));
    } else {
      setBase(symbolParam);
      setQuote("");
    }
  }, [symbolParam]);

  useEffect(() => {
    fetch("http://localhost:5245/api/coins/symbols", {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: getJwtToken() ? `Bearer ${getJwtToken()}` : "",
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Ошибка при загрузке списка символов");
        return r.json();
      })
      .then((data: string[]) => {
        if (!Array.isArray(data)) return;
        setCoins(data);

        if (!symbolParam) {
          if (data.length >= 2) {
            setBase(data[0]);
            setQuote(data[1]);
          } else if (data.length === 1) {
            setBase(data[0]);
            setQuote(data[0]);
          }
        }
      })
      .catch((err) => {
        console.error("Ошибка symbols fetch:", err);
      });
  }, [symbolParam]);
  
  const fetchOrderBook = useCallback(() => {
    if (!base || !quote) return;
    fetch(
      `http://localhost:5245/api/markets/orderbook?base=${encodeURIComponent(
        base
      )}&quote=${encodeURIComponent(quote)}`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: getJwtToken() ? `Bearer ${getJwtToken()}` : "",
        },
      }
    )
      .then((r) => {
        if (!r.ok) throw new Error("Ошибка при получении книги ордеров");
        return r.json();
      })
      .then((data: OrderBookDto) => {
        setOrderBook({
          bids: data.buys.map((o) => ({
            price: o.price,
            amount: o.amount,
            total: o.total,
          })),
          asks: data.sells.map((o) => ({
            price: o.price,
            amount: o.amount,
            total: o.total,
          })),
        });
      })
      .catch((err) => {
        console.error("OrderBook fetch error:", err);
        setOrderBook({ bids: [], asks: [] });
      });
  }, [base, quote]);

  const fetchMyOrders = useCallback(async () => {
    try {
      const token = getJwtToken();
      if (!token) return;

      const resp = await fetch("http://localhost:5245/api/markets/myorders", {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok) return;

      const contentType = resp.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) return;

      const raw = (await resp.json()) as any[];
      const mapped: OpenOrder[] = raw.map((o) => {
       const priceNum = parseFloat(String(o.price));
       const amountNum = parseFloat(String(o.amount));
       const serverTotal = parseFloat(String(o.total));
       const totalNum = isNaN(serverTotal) || serverTotal <= 0 ? priceNum * amountNum : serverTotal;

       return {
         id: o.id,
         pair: o.pair,
         type: o.type === "buy" ? "buy" : "sell",
         status: o.status === "open" ? "open" : o.status === "fulfilled"? "fulfilled" : "cancelled",
         price: isNaN(priceNum) ? 0 : priceNum,
         amount: isNaN(amountNum) ? 0 : amountNum,
         total: isNaN(totalNum) ? 0 : totalNum,
       };
     });

      setMyOrders(mapped);
    } catch (e) {
      console.error("Ошибка при загрузке моих ордеров:", e);
    }
  }, []);

  useEffect(() => {
    if (!base || !quote) return;

    fetch(
      `http://localhost:5245/api/markets/${encodeURIComponent(
        base
      )}/${encodeURIComponent(quote)}/ticker`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: getJwtToken() ? `Bearer ${getJwtToken()}` : "",
        },
      }
    )
      .then((r) => {
        if (!r.ok) throw new Error("Ошибка при получении тикера");
        return r.json();
      })
      .then((data: { price: number; change24h: number }) => {
        setTicker({
          currentPrice: data.price,
          change24h: data.change24h,
        });
      })
      .catch((err) => {
        console.error("Ticker fetch error:", err);
        setTicker({ currentPrice: 0, change24h: 0 });
      });

    fetchOrderBook();
    fetchMyOrders();
  }, [base, quote, fetchOrderBook, fetchMyOrders]);

  const placeOrder = async () => {
    if (!price || !amount) {
      alert("Введите и цену, и объём");
      return;
    }

    try {
      const body = {
        Base: base,
        Quote: quote,
        Side: side,
        Price: parseFloat(price),
        Amount: parseFloat(amount),
      };

      const resp = await fetch("http://localhost:5245/api/markets/place", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: getJwtToken() ? `Bearer ${getJwtToken()}` : "",
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const contentType = resp.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const errJson = await resp.json();
          alert(`Ошибка при создании ордера: ${errJson.message || resp.status}`);
        } else {
          const errText = await resp.text();
          console.error("PlaceOrder unexpected response:", errText);
          alert(`Ошибка при создании ордера (код ${resp.status})`);
        }
        return;
      }

      setPrice("");
      setAmount("");
      fetchOrderBook();
      fetchMyOrders();
    } catch (e) {
      console.error("Ошибка placeOrder:", e);
      alert("Произошла непредвиденная ошибка при создании ордера");
    }
  };

  const cancelOrder = async (orderId: number) => {
    try {
      const resp = await fetch(
        `http://localhost:5245/api/markets/order/${orderId}/cancel`,
        {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: getJwtToken() ? `Bearer ${getJwtToken()}` : "",
          },
        }
      );
      if (!resp.ok) {
        const contentType = resp.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const errJson = await resp.json();
          alert(`Ошибка при отмене ордера: ${errJson.message || resp.status}`);
        } else {
          const errText = await resp.text();
          console.error("CancelOrder unexpected response:", errText);
          alert(`Ошибка при отмене (код ${resp.status})`);
        }
        return;
      }

      fetchOrderBook();
      fetchMyOrders();
    } catch (e) {
      console.error("Ошибка cancelOrder:", e);
      alert("Произошла ошибка при отмене ордера");
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4 grid lg:grid-cols-4 gap-4">
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-[#1e2329] rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Base</label>
              <select
                className="w-full bg-[#2b3139] text-white p-2 rounded"
                value={base}
                onChange={(e) => setBase(e.target.value)}
              >
                {coins.map((sym) => (
                  <option key={sym} value={sym}>
                    {sym}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Quote</label>
              <select
                className="w-full bg-[#2b3139] text-white p-2 rounded"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
              >
                {coins.map((sym) => (
                  <option key={sym} value={sym}>
                    {sym}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[#1e2329] rounded-lg p-4 space-y-4">
            <Tabs
              value={side}
              onValueChange={(v) => setSide(v as "buy" | "sell")}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2">
                <TabsTrigger
                  value="buy"
                  className="bg-green-900/20 data-[state=active]:bg-green-900/40 text-green-500"
                >
                  Buy
                </TabsTrigger>
                <TabsTrigger
                  value="sell"
                  className="bg-red-900/20 data-[state=active]:bg-red-900/40 text-red-500"
                >
                  Sell
                </TabsTrigger>
              </TabsList>

              <TabsContent value="buy" className="space-y-3">
                <label className="text-xs text-gray-400">
                  Price ({quote})
                </label>
                <Input
                  className="bg-[#2b3139]"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={`Enter price in ${quote}`}
                  type="number"
                />

                <label className="text-xs text-gray-400">
                  Amount ({base})
                </label>
                <Input
                  className="bg-[#2b3139]"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Enter amount of ${base}`}
                  type="number"
                />

                <div>
                  <label className="text-xs text-gray-400">Total ({quote})</label>
                  <Input className="bg-[#2b3139]" value={total} readOnly />
                </div>

                <Button onClick={placeOrder} className="w-full bg-green-600">
                  Buy {base}
                </Button>
              </TabsContent>

              <TabsContent value="sell" className="space-y-3">
                <label className="text-xs text-gray-400">
                  Price ({quote})
                </label>
                <Input
                  className="bg-[#2b3139]"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={`Enter price in ${quote}`}
                  type="number"
                />

                <label className="text-xs text-gray-400">
                  Amount ({base})
                </label>
                <Input
                  className="bg-[#2b3139]"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Enter amount of ${base}`}
                  type="number"
                />

                <div>
                  <label className="text-xs text-gray-400">Total ({quote})</label>
                  <Input className="bg-[#2b3139]" value={total} readOnly />
                </div>

                <Button onClick={placeOrder} className="w-full bg-red-600">
                  Sell {base}
                </Button>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <h4 className="text-sm text-gray-400">Order Book</h4>

              <div className="grid grid-cols-3 gap-4 text-xs text-gray-400 px-1">
                <div>Price ({quote})</div>
                <div>Amount ({base})</div>
                <div>Total ({quote})</div>
              </div>

              <div className="mt-1 max-h-48 overflow-y-auto">
                {orderBook.asks.map((o, i) => (
                  <div
                    key={`ask-${i}`}
                    className="grid grid-cols-3 gap-4 text-xs text-red-500 px-1"
                  >
                    <span>${o.price.toFixed(5)}</span>
                    <span className="text-gray-300">{o.amount.toFixed(5)}</span>
                    <span className="text-gray-400">${o.total.toFixed(5)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 my-2" />
              <div className="max-h-48 overflow-y-auto">
                {orderBook.bids.map((o, i) => (
                  <div
                    key={`bid-${i}`}
                    className="grid grid-cols-3 gap-4 text-xs text-green-500 px-1"
                  >
                    <span>${o.price.toFixed(5)}</span>
                    <span className="text-gray-300">{o.amount.toFixed(5)}</span>
                    <span className="text-gray-400">${o.total.toFixed(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#1e2329] rounded-lg p-4 flex justify-between items-center">
            <div className="flex items-center">
              <div>
                <h2 className="text-xl font-semibold">
                  {base}/{quote}
                </h2>
                <p className="text-gray-400">
                  {ticker.change24h > 0 ? "+" + ticker.change24h.toFixed(2) + "%" : ticker.change24h.toFixed(2) + "%"}{" "}(24h)
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-medium">
                ${ticker.currentPrice.toFixed(8)}
              </div>
            </div>
          </div>

          <div className="bg-[#1e2329] rounded-lg p-4 space-y-4">
            <div className="flex gap-2">
              {(["1m", "5m", "15m", "1h", "4h", "1d"] as const).map((intv) => (
                <Button
                  key={intv}
                  variant={interval === intv ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInterval(intv)}
                >
                  {intv}
                </Button>
              ))}
            </div>

            <div className="h-96">
              {base && quote ? (
                <CandleChart base={base} quote={quote} interval={interval} height={384} />
              ) : (
                <p className="text-gray-400">Выберите пару для отображения графика</p>
              )}
            </div>
          </div>

          <div className="bg-[#1e2329] rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">My Orders</h3>
            {myOrders.length === 0 ? (
              <p className="text-gray-400">You don’t have any orders yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-2 px-1">ID</th>
                      <th className="py-2 px-1">Type</th>
                      <th className="py-2 px-1">Price</th>
                      <th className="py-2 px-1">Amount</th>
                      <th className="py-2 px-1">Total</th>
                      <th className="py-2 px-1">Pair</th>
                      <th className="py-2 px-1">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        className="border-b border-gray-800 hover:bg-[#2b3139]"
                      >
                        <td className="py-2 px-1">{ord.id}</td>
                        <td className="py-2 px-1 capitalize">{ord.type}</td>
                        <td className="py-2 px-1">${ord.price.toFixed(8)}</td>
                        <td className="py-2 px-1">{ord.amount.toFixed(8)}</td>
                        <td className="py-2 px-1">${ord.total.toFixed(8)}</td>
                        <td className="py-2 px-1 capitalize">{ord.pair}</td>
                        <td className="py-2 px-1">
                          {ord.status === "open" ? (
                            <button
                              onClick={() => cancelOrder(ord.id)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
