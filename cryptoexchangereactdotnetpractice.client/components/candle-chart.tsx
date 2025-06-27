"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export interface CandleChartProps {
    base: string;
    quote: string;
    interval: string; 
    width?: string | number; 
    height?: string | number;
}

interface CandlePoint {
    x: string;
    y: [number, number, number, number];
}

interface CandleResponse {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

const CandleChart: React.FC<CandleChartProps> = ({
    base,
    quote,
    interval,
    width = "100%",
    height = 400,
}) => {
    const [series, setSeries] = useState([
        {
            data: [] as CandlePoint[],
        },
    ]);
    const [options, setOptions] = useState({});
    const [loading, setLoading] = useState(true);

    const loadCandles = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `http://localhost:5245/api/markets/${base}/${quote}/candles?interval=${interval}`
            );
            if (!res.ok) throw new Error("Не удалось получить данные свечей");
            const candles: CandleResponse[] = await res.json();
            
            const chartData: CandlePoint[] = candles.map((c) => ({
                x: c.timestamp,
                y: [c.open, c.high, c.low, c.close],
            }));

            setSeries([{ data: chartData }]);

            setOptions({
                chart: {
                    type: "candlestick",
                    height: 350,
                    toolbar: {
                        show: false,
                    },
                },
                xaxis: {
                    type: "datetime" as const,
                },
                yaxis: {
                    tooltip: {
                        enabled: true,
                    },
                    labels: {
                        formatter: function (val: number) {
                            return val.toFixed(2);
                        },
                    },
                },
                tooltip: {
                    enabled: true,
                    theme: "light",
                    y: {
                        formatter: function (val: number) {
                            return val.toFixed(8);
                        },
                    },
                },
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (base && quote && interval) {
            loadCandles();
        }
    }, [base, quote, interval]);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-4 text-white">
                Loading…
            </div>
        );
    }

    return (
        <div>
            <Chart
                options={options as any}
                series={series as any}
                type="candlestick"
                width={width}
                height={height}
            />
        </div>
    );
};

export default CandleChart;
