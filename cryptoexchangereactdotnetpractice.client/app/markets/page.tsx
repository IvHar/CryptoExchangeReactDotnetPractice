"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X,} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export interface Coin {
  id: number;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  capitalization: number;
  image: string;
}

export default function MarketsPage() {
  const [hot, setHot] = useState<Coin[]>([]);
  const [newListing, setNewListing] = useState<Coin[]>([]);
  const [gainers, setGainers] = useState<Coin[]>([]);
  const [topTraded, setTopTraded] = useState<Coin[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [sortBy, setSortBy] = useState<keyof Coin>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const params = useSearchParams();
  const initial = params.get("search") ?? "";
  const [searchTerm, setSearchTerm] = useState(initial);

  const [showFilter, setShowFilter] = useState(false);
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [capMin, setCapMin] = useState<number | "">("");
  const [capMax, setCapMax] = useState<number | "">("");
  const [priceMinInput, setPriceMinInput] = useState<string>("");
  const [priceMaxInput, setPriceMaxInput] = useState<string>("");
  const [capMinInput, setCapMinInput] = useState<string>("");
  const [capMaxInput, setCapMaxInput] = useState<string>("");

  useEffect(() => {
    const q = params.get("search") ?? "";
    setSearchTerm(q);
    setPage(1);
  }, [params]);

  useEffect(() => {
    fetch("http://localhost:5245/api/coins/popular?count=3")
      .then((r) => r.json())
      .then(setHot);
    fetch("http://localhost:5245/api/coins/newListing?count=3")
      .then((r) => r.json())
      .then(setNewListing);
    fetch("http://localhost:5245/api/coins/topGainers?count=3")
      .then((r) => r.json())
      .then(setGainers);
    fetch("http://localhost:5245/api/coins/topTraded?count=3")
      .then((r) => r.json())
      .then(setTopTraded);
    fetch("http://localhost:5245/api/coins")
      .then((r) => r.json())
      .then(setCoins);
  }, []);

  const toggleSort = (col: keyof Coin) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: keyof Coin }) => {
    if (sortBy !== col)
      return <ArrowUpDown className="h-4 w-4 text-gray-500 ml-1" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-4 w-4 text-white ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 text-white ml-1" />
    );
  };

  const sorted = [...coins].sort((a, b) => {
    const va = a[sortBy];
    const vb = b[sortBy];

    if (sortBy === "name" || sortBy === "symbol") {
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      if (sa < sb) return sortDir === "asc" ? -1 : 1;
      if (sa > sb) return sortDir === "asc" ? 1 : -1;
      return 0;
    }

    if (sortBy === "price" || sortBy === "change24h" || sortBy === "volume24h") {
      const na = va as number;
      const nb = vb as number;
      return sortDir === "asc" ? na - nb : nb - na;
    }

    if (sortBy === "capitalization") {
      return sortDir === "asc"
        ? a.capitalization - b.capitalization
        : b.capitalization - a.capitalization;
    }
    return 0;
  });

  const searched = sorted.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      c.symbol.toLowerCase().includes(term) ||
      c.name.toLowerCase().includes(term)
    );
  });

  const filtered = searched.filter((c) => {
    if (priceMin !== "" && c.price < priceMin) return false;
    if (priceMax !== "" && c.price > priceMax) return false;

    if (capMin !== "" && c.capitalization < capMin) return false;
    if (capMax !== "" && c.capitalization > capMax) return false;

    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const previewCount = searched.filter((c) => {
    const p = c.price;
    if (priceMinInput && p < parseFloat(priceMinInput)) return false;
    if (priceMaxInput && p > parseFloat(priceMaxInput)) return false;
    const cap = c.capitalization;
    if (capMinInput && cap < parseFloat(capMinInput)) return false;
    if (capMaxInput && cap > parseFloat(capMaxInput)) return false;
    return true;
  }).length;

  return (
    <main className="min-h-screen bg-[#0b0e11] text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Markets Overview</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <Panel title="Hot Coins" items={hot} />
          <Panel title="New Listing" items={newListing} />
          <Panel title="Top Gainers" items={gainers} />
          <Panel title="Top Traded (24h)" items={topTraded} />
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by symbol or name"
              className="pl-10 bg-[#1e2329] border-gray-700 text-white"
            />
          </div>
          <Button
            variant="outline"
            className="flex items-center border-gray-700 text-gray-300"
            onClick={() => setShowFilter((prev) => !prev)}
          >
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
        </div>

        <div className="bg-[#1e2329] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-bold">Coins List</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {([
                  ["name", "Name"],
                  ["price", "Price"],
                  ["change24h", "24h Change"],
                  ["volume24h", "24h Volume"],
                  ["capitalization", "Market Cap"],
                ] as [keyof Coin, string][]).map(([col, label]) => (
                  <th
                    key={col}
                    className={`p-4 text-sm font-medium text-gray-400 cursor-pointer ${
                      col === "name" ? "text-left" : "text-right"
                    }`}
                    onClick={() => toggleSort(col)}
                  >
                    <div className="inline-flex items-center">
                      {label}
                      <SortIcon col={col} />
                    </div>
                  </th>
                ))}
                <th className="text-right p-4 text-sm font-medium text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-800 hover:bg-[#2b3139]"
                >
                  <td className="p-4 text-left">
                    <Link href={`/markets/${c.id}`} className="flex items-center">
                      <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                        <img
                          src={`http://localhost:5245/${c.image}`}
                          alt={c.symbol}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-gray-400">{c.symbol}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4 text-right font-medium">
                    ${c.price.toFixed(2)}
                  </td>
                  <td
                    className={`p-4 text-right text-xs ${
                      c.change24h < 0 ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {c.change24h > 0
                      ? "+" + c.change24h.toFixed(2) + "%"
                      : c.change24h.toFixed(2) + "%"}
                  </td>
                  <td className="p-4 text-right text-gray-300">
                    {c.volume24h.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="p-4 text-right text-gray-300">
                    ${c.capitalization.toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/trade?symbol=${c.symbol}USDT`}>
                      <Button className="bg-[#f0b90b] hover:bg-[#d9a520] text-black rounded-md text-xs px-3 py-1">
                        Trade
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Previous
          </Button>
          <span className="text-gray-400">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      </div>

      {showFilter && (
        <div className="fixed top-0 right-0 h-full w-80 bg-[#11151a] shadow-lg z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg">Filters</h3>
            <button onClick={() => setShowFilter(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 space-y-6 flex-1 overflow-auto">
            <div>
              <label className="text-sm text-gray-400">Price min</label>
              <Input
                type="number"
                placeholder="0"
                value={priceMinInput}
                onChange={(e) => setPriceMinInput(e.target.value)}
                className="bg-[#1e2329] border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Price max</label>
              <Input
                type="number"
                placeholder="0"
                value={priceMaxInput}
                onChange={(e) => setPriceMaxInput(e.target.value)}
                className="bg-[#1e2329] border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Market Cap min</label>
              <Input
                type="number"
                placeholder="0"
                value={capMinInput}
                onChange={(e) => setCapMinInput(e.target.value)}
                className="bg-[#1e2329] border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Market Cap max</label>
              <Input
                type="number"
                placeholder="0"
                value={capMaxInput}
                onChange={(e) => setCapMaxInput(e.target.value)}
                className="bg-[#1e2329] border-gray-700 text-white"
              />
            </div>

            <Button
              className="w-full bg-[#f0b90b] text-black"
              onClick={() => {
                setPriceMin(
                  priceMinInput !== "" ? parseFloat(priceMinInput) : ""
                );
                setPriceMax(
                  priceMaxInput !== "" ? parseFloat(priceMaxInput) : ""
                );
                setCapMin(
                  capMinInput !== "" ? parseFloat(capMinInput) : ""
                );
                setCapMax(
                  capMaxInput !== "" ? parseFloat(capMaxInput) : ""
                );
                setPage(1);
                setShowFilter(false);
              }}
            >
              Apply ({previewCount})
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setPriceMinInput("");
                setPriceMaxInput("");
                setCapMinInput("");
                setCapMaxInput("");
                setPriceMin("");
                setPriceMax("");
                setCapMin("");
                setCapMax("");
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}

function Panel({
  title,
  items,
}: {
  title: string;
  items: Coin[];
}) {
  return (
    <div className="bg-[#1e2329] rounded-lg p-4">
      <h3 className="text-sm text-gray-400 mb-2">{title}</h3>
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.id} className="flex justify-between items-center">
            <span className="flex items-center">
              <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                <img
                  src={`http://localhost:5245/${c.image}`}
                  alt={c.symbol}
                  className="w-full h-full object-cover"
                />
              </div>
              {c.symbol}
            </span>
            <div className="text-right">
              <div>${c.price.toFixed(2)}</div>
              <div
                className={`text-xs ${
                  c.change24h < 0 ? "text-red-500" : "text-green-500"
                }`}
              >
                {c.change24h > 0
                  ? "+" + c.change24h.toFixed(2) + "%"
                  : c.change24h.toFixed(2) + "%"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
