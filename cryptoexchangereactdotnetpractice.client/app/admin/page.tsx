"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import AdminProtected from "@/components/admin-protected";
import Footer from "@/components/footer";
import {Tabs, TabsList, TabsTrigger, TabsContent,} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Trash2, XCircle, UserCheck, UserX, Save,} from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface User {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email?: string;
    phone?: string;
    role: "user" | "admin";
}

interface Coin {
    id: number;
    name: string;
    symbol: string;
    price: number;
    capitalization: number;
    imageUrl: string;
}

interface Wallet {
    walletId: number;
    username: string;
    coinSymbol: string;
    amount: number;
}

interface Transaction {
    id: number;
    sender: string;
    receiver: string;
    amount: number;
    coinSymbol: string;
    timestamp: string;
}

interface CreateCoinDto {
    name: string;
    symbol: string;
    initialPrice: number;
    capitalization: number;
    image: File | null;
}

export default function AdminPage() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const [tab, setTab] = useState<string>("users");
    const [users, setUsers] = useState<User[]>([]);
    const [coins, setCoins] = useState<Coin[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [txs, setTxs] = useState<Transaction[]>([]);

    const [uq, setUq] = useState("");
    const [cq, setCq] = useState("");
    const [wq, setWq] = useState("");
    const [tq, setTq] = useState("");

    const [adding, setAdding] = useState(false);
    const [newCoin, setNewCoin] = useState<CreateCoinDto>({
        name: "",
        symbol: "",
        initialPrice: 0,
        capitalization: 0,
        image: null,
    });
    
    useEffect(() => {
        if (!token) return;

        fetch("http://localhost:5245/api/admin/users", { headers: authHeader })
            .then((r) => r.json())
            .then(setUsers)
            .catch(console.error);

        fetch("http://localhost:5245/api/admin/coins", { headers: authHeader })
            .then((r) => r.json())
            .then(setCoins)
            .catch(console.error);

        fetch("http://localhost:5245/api/admin/wallets", { headers: authHeader })
            .then((r) => r.json())
            .then(setWallets)
            .catch(console.error);

        fetch("http://localhost:5245/api/admin/transactions", { headers: authHeader })
            .then((r) => r.json())
            .then(setTxs)
            .catch(console.error);
    }, [token]);
    
    const fu = users.filter((u) =>
        [u.firstName, u.lastName, u.username, u.email, u.phone]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(uq.toLowerCase())
    );
    const fc = coins.filter((c) =>
        [c.name, c.symbol].join(" ").toLowerCase().includes(cq.toLowerCase())
    );
    const fw = wallets.filter((w) => w.username.toLowerCase().includes(wq.toLowerCase()));
    const ft = txs.filter((t) =>
        [t.sender, t.receiver].filter(Boolean).join(" ").toLowerCase().includes(tq.toLowerCase())
    );

    const toggleRole = async (u: User) => {
        const nextRole = u.role === "admin" ? "user" : "admin";
        await fetch(`http://localhost:5245/api/admin/users/${u.id}/role`, {
            method: "PUT",
            headers: { ...authHeader, "Content-Type": "application/json" },
            body: JSON.stringify({ role: nextRole }),
        });
        setUsers((prev) =>
            prev.map((x) => (x.id === u.id ? { ...x, role: nextRole } : x))
        );
    };
    
    const deleteCoin = async (id: number) => {
        if (!confirm("Are you sure you want to delete this coin?")) return;
        await fetch(`http://localhost:5245/api/admin/coins/${id}`, {
            method: "DELETE",
            headers: authHeader,
        });
        setCoins((prev) => prev.filter((c) => c.id !== id));
    };
    
    const saveCoin = async () => {
        if (!newCoin.image) {
            alert("Выберите изображение!");
            return;
        }

        const fd = new FormData();
        fd.append("Name", newCoin.name);
        fd.append("Symbol", newCoin.symbol);
        fd.append("InitialPrice", newCoin.initialPrice.toString());
        fd.append("Capitalization", newCoin.capitalization.toString());
        fd.append("Image", newCoin.image);

        const resp = await fetch("http://localhost:5245/api/admin/coins", {
            method: "POST",
            headers: authHeader,
            body: fd,
        });

        if (!resp.ok) {
            alert("Ошибка при загрузке монеты");
            return;
        }

        setNewCoin({ name: "", symbol: "", initialPrice: 0, capitalization: 0, image: null });
        setAdding(false);

        const updated = await fetch("http://localhost:5245/api/admin/coins", {
            headers: authHeader,
        })
            .then((r) => r.json())
            .catch(() => []);
        setCoins(updated);
    };

    const generatePdfReport = () => {
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        doc.setFontSize(18);
        doc.text("Admin Report", 40, 50);
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 70);
        let yOffset = 90;
        doc.setFontSize(14);
        doc.text("Users", 40, yOffset);
        yOffset += 10;

        autoTable(doc, {
            startY: yOffset,
            head: [["ID", "First", "Last", "Username", "Email", "Phone", "Role"]],
            body: users.map((u) => [
                u.id.toString(),
                u.firstName,
                u.lastName,
                u.username,
                u.email || "—",
                u.phone || "—",
                u.role,
            ]),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [30, 30, 30] },
            margin: { left: 40, right: 40 },
        });
        yOffset = (doc as any).lastAutoTable.finalY + 20;
        
        doc.setFontSize(14);
        doc.text("Cryptocurrencies", 40, yOffset);
        yOffset += 10;

        autoTable(doc, {
            startY: yOffset,
            head: [["ID", "Name", "Symbol", "Price", "Market Cap"]],
            body: coins.map((c) => [
                c.id.toString(),
                c.name,
                c.symbol,
                c.price.toFixed(2),
                c.capitalization.toLocaleString(),
            ]),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [30, 30, 30] },
            margin: { left: 40, right: 40 },
        });
        yOffset = (doc as any).lastAutoTable.finalY + 20;
        
        doc.setFontSize(14);
        doc.text("Wallets", 40, yOffset);
        yOffset += 10;

        autoTable(doc, {
            startY: yOffset,
            head: [["Wallet ID", "Username", "Coin", "Amount"]],
            body: wallets.map((w) => [
                w.walletId.toString(),
                w.username,
                w.coinSymbol,
                w.amount.toString(),
            ]),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [30, 30, 30] },
            margin: { left: 40, right: 40 },
        });
        yOffset = (doc as any).lastAutoTable.finalY + 20;
        
        doc.setFontSize(14);
        doc.text("Transactions", 40, yOffset);
        yOffset += 10;

        autoTable(doc, {
            startY: yOffset,
            head: [["ID", "Sender", "Receiver", "Amount", "Coin", "Timestamp"]],
            body: txs.map((t) => [
                t.id.toString(),
                t.sender || "—",
                t.receiver || "—",
                t.amount.toString(),
                t.coinSymbol,
                new Date(t.timestamp).toLocaleString(),
            ]),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [30, 30, 30] },
            margin: { left: 40, right: 40 },
        });

        doc.save(`admin_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const generateExcelReport = () => {
        const usersData = [
            ["ID", "First", "Last", "Username", "Email", "Phone", "Role"],
            ...users.map((u) => [
                u.id,
                u.firstName,
                u.lastName,
                u.username,
                u.email || "—",
                u.phone || "—",
                u.role,
            ]),
        ];

        const coinsData = [
            ["ID", "Name", "Symbol", "Price", "Market Cap"],
            ...coins.map((c) => [
                c.id,
                c.name,
                c.symbol,
                c.price,
                c.capitalization,
            ]),
        ];

        const walletsData = [
            ["Wallet ID", "Username", "Coin", "Amount"],
            ...wallets.map((w) => [
                w.walletId,
                w.username,
                w.coinSymbol,
                w.amount,
            ]),
        ];

        const txData = [
            ["ID", "Sender", "Receiver", "Amount", "Coin", "Timestamp"],
            ...txs.map((t) => [
                t.id,
                t.sender || "—",
                t.receiver || "—",
                t.amount,
                t.coinSymbol,
                new Date(t.timestamp).toLocaleString(),
            ]),
        ];

        const wb = XLSX.utils.book_new();
        const wsUsers = XLSX.utils.aoa_to_sheet(usersData);
        const wsCoins = XLSX.utils.aoa_to_sheet(coinsData);
        const wsWallets = XLSX.utils.aoa_to_sheet(walletsData);
        const wsTx = XLSX.utils.aoa_to_sheet(txData);

        XLSX.utils.book_append_sheet(wb, wsUsers, "Users");
        XLSX.utils.book_append_sheet(wb, wsCoins, "Cryptos");
        XLSX.utils.book_append_sheet(wb, wsWallets, "Wallets");
        XLSX.utils.book_append_sheet(wb, wsTx, "Transactions");

        XLSX.writeFile(wb, `admin_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleBackup = async () => {
        try {
            const resp = await fetch("http://localhost:5245/api/admin/db/backup/download", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token") ?? ""}`
                },
            });

            if (!resp.ok) {
                let textError = await resp.text();
                alert("Ошибка при создании бэкапа: " + (textError || resp.status));
                return;
            }

            const blob = await resp.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;

            const suggestedName = `crypto_db_backup_${new Date()
                .toISOString()
                .slice(0, 19)
                .replace(/[:T]/g, "-")}.bak`;
            link.download = suggestedName;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(downloadUrl);
        } catch (ex: any) {
            console.error("Backup error:", ex);
            alert("Произошла ошибка при создании бэкапа: " + ex.message);
        }
    };

    const handleRestoreClick = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".bak";
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("backupFile", file);

            try {
                const resp = await fetch("http://localhost:5245/api/admin/db/restore", {
                    method: "POST",
                    headers: authHeader,
                    body: formData,
                });
                if (!resp.ok) {
                    const err = await resp.json();
                    alert("Ошибка при восстановлении: " + (err.error || resp.status));
                    return;
                }
                alert("База успешно восстановлена. Пожалуйста, перезапустите приложение.");
            } catch (ex) {
                console.error("Restore error:", ex);
                alert("Произошла ошибка при восстановлении бэкапа");
            }
        };
        input.click();
    };

    return (
        <AdminProtected>
            <div className="min-h-screen bg-[#0b0e11] text-white">
                <Navbar />
                <div className="max-w-7xl mx-auto p-8 space-y-6">
                    <h1 className="text-2xl font-bold">Admin Panel</h1>

                    <Tabs value={tab} onValueChange={(v) => setTab(v)}>
                        <TabsList className="bg-[#1e2329] p-1 rounded-lg mb-4">
                            <TabsTrigger value="users">Users</TabsTrigger>
                            <TabsTrigger value="coins">Cryptos</TabsTrigger>
                            <TabsTrigger value="wallets">Wallets</TabsTrigger>
                            <TabsTrigger value="transactions">Transactions</TabsTrigger>
                            <TabsTrigger value="reports">Reports</TabsTrigger>
                        </TabsList>

                        <TabsContent value="users">
                            <div className="flex items-center mb-3 gap-2">
                                <Search className="text-gray-400" />
                                <Input
                                    placeholder="Search users…"
                                    value={uq}
                                    onChange={(e) => setUq(e.target.value)}
                                    className="flex-1 bg-[#1e2329] text-white"
                                />
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {["ID", "First", "Last", "Username", "Email", "Phone", "Role", "Action", ].map((h) => (
                                            <TableHead key={h}>{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fu.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell>{u.id}</TableCell>
                                            <TableCell>{u.firstName}</TableCell>
                                            <TableCell>{u.lastName}</TableCell>
                                            <TableCell>{u.username}</TableCell>
                                            <TableCell>{u.email || "—"}</TableCell>
                                            <TableCell>{u.phone || "—"}</TableCell>
                                            <TableCell className={ u.role === "admin" ? "text-green-400" : "text-gray-400"} >
                                                {u.role}
                                            </TableCell>
                                            <TableCell>
                                                <Button size="icon" onClick={() => toggleRole(u)}>
                                                    {u.role === "admin" ? <UserX /> : <UserCheck />}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="coins">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Search className="text-gray-400" />
                                    <Input placeholder="Search coins…" value={cq} onChange={(e) => setCq(e.target.value)} className="bg-[#1e2329] text-white" />
                                </div>
                                <Button onClick={() => setAdding(true)} className="bg-[#f0b90b] hover:bg-[#d9a520]">
                                    <Plus className="mr-1" /> Add
                                </Button>
                            </div>

                            {adding && (
                                <div className="bg-[#1e2329] p-6 rounded-lg mb-6 space-y-4 shadow-lg">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-semibold">New Cryptocurrency</h3>
                                        <Button variant="ghost" size="icon" onClick={() => setAdding(false)}>
                                            <XCircle className="h-5 w-5 text-gray-400 hover:text-white" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-300">Name</label>
                                            <Input placeholder="Bitcoin" value={newCoin.name}
                                                onChange={(e) =>
                                                    setNewCoin((n) => ({ ...n, name: e.target.value }))
                                                }
                                                className="bg-[#2b3139] text-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-300">Symbol</label>
                                            <Input placeholder="BTC" value={newCoin.symbol}
                                                onChange={(e) =>
                                                    setNewCoin((n) => ({ ...n, symbol: e.target.value }))
                                                }
                                                className="bg-[#2b3139] text-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-300">
                                                Initial Price (USD)
                                            </label>
                                            <Input type="number" placeholder="50000" value={newCoin.initialPrice.toString()}
                                                onChange={(e) =>
                                                    setNewCoin((n) => ({
                                                        ...n,
                                                        initialPrice: parseFloat(e.target.value) || 0,
                                                    }))
                                                }
                                                className="bg-[#2b3139] text-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-300">Market Cap</label>
                                            <Input
                                                type="number"
                                                placeholder="1000000000"
                                                value={newCoin.capitalization.toString()}
                                                onChange={(e) =>
                                                    setNewCoin((n) => ({
                                                        ...n,
                                                        capitalization: parseFloat(e.target.value) || 0,
                                                    }))
                                                }
                                                className="bg-[#2b3139] text-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-300">Logo</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) =>
                                                    setNewCoin((n) => ({ ...n, image: e.target.files?.[0] ?? null }))
                                                }
                                                className="bg-[#2b3139] text-white w-full rounded p-2"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-3">
                                        <Button variant="outline" onClick={() => setAdding(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={saveCoin} className="bg-[#f0b90b] hover:bg-[#d9a520]">
                                            <Save className="h-4 w-4 mr-2" /> Create
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {["Name", "Sym", "Price", "Cap", "Img", "Edit"].map((h) => (
                                            <TableHead key={h}>{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fc.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell>{c.name}</TableCell>
                                            <TableCell>{c.symbol}</TableCell>
                                            <TableCell>${c.price.toFixed(2)}</TableCell>
                                            <TableCell>{c.capitalization.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <img
                                                    src={`http://localhost:5245/${c.imageUrl}`}
                                                    className="w-6 h-6 rounded-full"
                                                    alt={`${c.name} logo`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button size="icon" onClick={() => deleteCoin(c.id)}>
                                                    <Trash2 />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="wallets">
                            <div className="flex items-center mb-3 gap-2">
                                <Search className="text-gray-400" />
                                <Input
                                    placeholder="Search wallets…"
                                    value={wq}
                                    onChange={(e) => setWq(e.target.value)}
                                    className="bg-[#2b3139] text-white"
                                />
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {["Wallet ID", "Username", "Coin", "Amount"].map((h) => (
                                            <TableHead key={h}>{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fw.map((w) => (
                                        <TableRow key={w.walletId}>
                                            <TableCell>{w.walletId}</TableCell>
                                            <TableCell>{w.username}</TableCell>
                                            <TableCell>{w.coinSymbol}</TableCell>
                                            <TableCell>{w.amount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="transactions">
                            <div className="flex items-center mb-3 gap-2">
                                <Search className="text-gray-400" />
                                <Input
                                    placeholder="Search transactions by username…"
                                    value={tq}
                                    onChange={(e) => setTq(e.target.value)}
                                    className="bg-[#2b3139] text-white"
                                />
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {["ID", "Sender", "Receiver", "Amount", "Coin", "When"].map((h) => (
                                            <TableHead key={h}>{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ft.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell>{t.id}</TableCell>
                                            <TableCell>{t.sender || "—"}</TableCell>
                                            <TableCell>{t.receiver || "—"}</TableCell>
                                            <TableCell>{t.amount}</TableCell>
                                            <TableCell>{t.coinSymbol}</TableCell>
                                            <TableCell>{new Date(t.timestamp).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="reports">
                            <p className="text-gray-400">
                                Press the buttons below to generate a report containing all admin data or to create a backup of the database
                            </p>
                            <br />
                            <div className="flex flex-wrap justify-end mb-4 gap-3">
                                <Button onClick={generatePdfReport} className="bg-[#10b981] hover:bg-[#0f9d74]">
                                    Generate PDF Report
                                </Button>
                                <Button onClick={generateExcelReport} className="bg-[#3b82f6] hover:bg-[#2563EB]">
                                    Generate Excel Report
                                </Button>
                                <Button onClick={handleBackup} className="bg-[#F97316] hover:bg-[#EA580C]">
                                    Save DB Backup
                                </Button>
                                <Button onClick={handleRestoreClick} className="bg-[#EF4444] hover:bg-[#DC2626]">
                                    Restore From Backup
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                <Footer />
            </div>
        </AdminProtected>
    );
}
