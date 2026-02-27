import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useResolvedTheme from '@/hooks/useResolvedTheme';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateInput from '@/components/date-input';
import { useTransactionStore } from "@/store/transactionStore";
import { formatCurrency } from '@/utils/helper';
import { useCurrencyStore } from '@/store/currencyStore';
// We'll require expo modules at runtime to avoid static type issues in the repo

export default function DataBackupScreen() {
    const router = useRouter();
    const transactions = useTransactionStore((s) => s.transactions);
    const [loadingCsv, setLoadingCsv] = useState(false);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [useCustomRange, setUseCustomRange] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const exportCsv = async () => {
        try {
            setLoadingCsv(true);
            if (!transactions || transactions.length === 0) {
                Alert.alert("No data", "There are no transactions to export.");
                setLoadingCsv(false);
                return;
            }

            // Build CSV
            const header = ["id", "name", "amount", "date", "category"];
            const rows = transactions.map((t) => [
                String(t.id || ""),
                `"${(t.name || "").replace(/"/g, '""')}"`,
                String(t.amount || 0),
                String(t.date || ""),
                `"${(t.category || "").replace(/"/g, '""')}"`,
            ].join(","));

            const csv = [header.join(","), ...rows].join("\n");

            const FS: any = require("expo-file-system");
            const Sharing: any = require("expo-sharing");

            const filename = `transactions-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
            const fileUri = `${FS.documentDirectory}${filename}`;

            // Some versions of expo-file-system expose EncodingType differently (or not at all).
            // Use the runtime value if present, otherwise fall back to a plain 'utf8' string.
            const encoding = (FS && FS.EncodingType && FS.EncodingType.UTF8) || (FS && FS.Encoding && FS.Encoding.UTF8) || 'utf8';
            await FS.writeAsStringAsync(fileUri, csv, { encoding });

            // Share
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert("Export ready", `Saved to ${fileUri}`);
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to export CSV. Please try again.");
        } finally {
            setLoadingCsv(false);
        }
    };

    const exportMonthlyPdf = async () => {
        try {
            setLoadingPdf(true);

            // determine date range
            let rangeStart: Date;
            let rangeEnd: Date;
            if (useCustomRange && startDate && endDate) {
                rangeStart = startDate;
                rangeEnd = endDate;
            } else {
                const now = selectedMonth || new Date();
                rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
                rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            }

            const monthly = transactions.filter((t) => {
                const d = new Date(t.date || "");
                return d >= rangeStart && d <= rangeEnd;
            });

            if (!monthly || monthly.length === 0) {
                Alert.alert("No data", "No transactions in the selected range to include in the report.");
                setLoadingPdf(false);
                return;
            }

            const totals: Record<string, number> = {};
            let grandTotal = 0;
            monthly.forEach((t) => {
                const k = t.category || t.name || "Other";
                const amt = Number(t.amount || 0);
                totals[k] = (totals[k] || 0) + amt;
                grandTotal += amt;
            });

            const currency = useCurrencyStore.getState().currency;
            const rowsHtml = Object.entries(totals)
                .map(([cat, amt]) => `<tr><td style="padding:6px">${cat}</td><td style="padding:6px">${formatCurrency(amt, currency)}</td></tr>`)
                .join("");

            const periodLabel = useCustomRange && startDate && endDate
                ? `${rangeStart.toLocaleDateString()} — ${rangeEnd.toLocaleDateString()}`
                : `${rangeStart.toLocaleString(undefined, { month: "long", year: "numeric" })}`;

            const categories = Object.entries(totals).sort((a, b) => b[1] - a[1]);
            const max = categories.length ? categories[0][1] : 1;
            const bars = categories.map(([cat, amt]) => {
                const w = Math.round((amt / max) * 300);
                return `<div style="display:flex;align-items:center;margin-bottom:6px"><div style="width:120px">${cat}</div><div style="flex:1;background:#E5E7EB;border-radius:6px;margin-left:8px"><div style="width:${w}px;background:#3B82F6;height:14px;border-radius:6px"></div></div><div style="width:80px;text-align:right;padding-left:8px">${formatCurrency(amt, currency)}</div></div>`;
            }).join("\n");

            const html = `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial;
        padding: 24px;
        color: #111827;
      }

      .muted { color: #6B7280; }
      .title { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
      .subtitle { font-size: 14px; margin-bottom: 20px; }

      .meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        margin-bottom: 16px;
        color: #6B7280;
      }

      .cards {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
      }

      .card {
        flex: 1;
        border: 1px solid #E5E7EB;
        border-radius: 12px;
        padding: 12px;
      }

      .card-title {
        font-size: 12px;
        color: #6B7280;
        margin-bottom: 4px;
      }

      .card-value {
        font-size: 18px;
        font-weight: 600;
      }

      h3 {
        margin-top: 24px;
        margin-bottom: 10px;
        font-size: 16px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }

      th {
        text-align: left;
        font-size: 12px;
        color: #6B7280;
        border-bottom: 1px solid #E5E7EB;
        padding-bottom: 6px;
      }

      td {
        padding: 8px 0;
        border-bottom: 1px solid #F3F4F6;
        font-size: 13px;
      }

      .amount {
        text-align: right;
        font-weight: 500;
      }

      .bar-row {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        font-size: 13px;
      }

      .bar-label {
        width: 120px;
      }

      .bar {
        flex: 1;
        background: #E5E7EB;
        height: 14px;
        border-radius: 999px;
        margin: 0 8px;
      }

      .bar-fill {
        height: 14px;
        background: #3B82F6;
        border-radius: 999px;
      }

      .footer {
        margin-top: 32px;
        font-size: 11px;
        color: #9CA3AF;
        text-align: center;
      }
    </style>
  </head>

  <body>
    <!-- Header -->
    <div class="title">Expense Summary Report</div>
    <div class="subtitle muted">By Expense Buddy</div>

    <!-- Meta -->
    <div class="meta">
      <div>Period: ${periodLabel}</div>
      <div>Generated: ${new Date().toLocaleDateString()}</div>
    </div>

    <!-- Summary cards -->
    <div class="cards">
      <div class="card">
        <div class="card-title">Total Spending</div>
        <div class="card-value">${formatCurrency(grandTotal, currency)}</div>
      </div>
      <div class="card">
        <div class="card-title">Transactions</div>
        <div class="card-value">${monthly.length}</div>
      </div>
      <div class="card">
        <div class="card-title">Categories</div>
        <div class="card-value">${Object.keys(totals).length}</div>
      </div>
    </div>

    <!-- Category bars -->
    <h3>Spending by Category</h3>
    ${bars}

    <!-- Detailed table -->
    <h3>Detailed Breakdown</h3>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Date</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${monthly
          .map((t) => {
            const label = t.name || t.category || "Other";
            return `
              <tr>
                <td>${label}</td>
                <td class="muted">${new Date(t.date).toLocaleDateString()}</td>
                <td class="amount">${formatCurrency(Number(t.amount || 0), currency)}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>

    <!-- Footer -->
    <div class="footer">
      Generated from Expense Manager App
    </div>
  </body>
</html>
`;

            const Print: any = require("expo-print");
            const Sharing: any = require("expo-sharing");
            const FS: any = require("expo-file-system");

            const { uri } = await Print.printToFileAsync({ html });

            // Create a logical, human-readable filename for the PDF and move the file there
            const makeFilename = () => {
                if (useCustomRange && startDate && endDate) {
                    const s = startDate.toISOString().slice(0, 10);
                    const e = endDate.toISOString().slice(0, 10);
                    return `report-${s}-to-${e}.pdf`;
                }
                const y = rangeStart.getFullYear();
                const m = String(rangeStart.getMonth() + 1).padStart(2, "0");
                return `report-${y}-${m}.pdf`;
            };

            const filename = makeFilename();
            const destUri = `${FS.documentDirectory}${filename}`;

            let shareUri = uri;
            try {
                // move the temp PDF to a nicer filename location
                await FS.moveAsync({ from: uri, to: destUri });
                shareUri = destUri;
            } catch (moveErr) {
                // If move fails, fall back to the original uri but log the error
                console.warn("Failed to move PDF to a friendly filename, sharing temp file:", moveErr);
            }

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(shareUri, { mimeType: "application/pdf" });
            } else {
                Alert.alert("Report ready", `Saved to ${shareUri}`);
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to create PDF report. Please try again.");
        } finally {
            setLoadingPdf(false);
        }
    };

    const { classFor } = useResolvedTheme();

    return (
        <SafeAreaView className={`${classFor('flex-1 bg-white px-4 py-6','flex-1 bg-neutral-900 px-4 py-6')}`}>
            {/* Header */}
            <View className="flex-row items-center my-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="gray" />
                </TouchableOpacity>
                <Text className={classFor('flex-1 text-center text-2xl font-bold text-gray-800','flex-1 text-center text-2xl font-bold text-gray-100')}>Data & Backup</Text>
            </View>

            <View className="space-y-4">
                {/* Month selector / custom range */}
                <View className={`${classFor('bg-white','bg-neutral-800')} rounded-2xl p-4 my-4 shadow-lg`}>
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className={classFor("text-lg font-semibold", "text-lg font-semibold text-gray-100")}>Report range</Text>
                        <TouchableOpacity onPress={() => setUseCustomRange((s) => !s)} className="px-3 py-1 rounded-full bg-gray-100">
                            <Text className="text-sm">{useCustomRange ? 'Use Month' : 'Custom range'}</Text>
                        </TouchableOpacity>
                    </View>
                    {!useCustomRange ? (
                        <View className="flex-row items-center justify-between">
                            <TouchableOpacity onPress={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))} className="px-3 py-2">
                                <Text className={classFor('text-gray-800', 'text-gray-100')}>◀</Text>
                            </TouchableOpacity>
                            <Text className={classFor('text-base font-medium text-gray-800', 'text-base font-medium text-gray-100')}>{selectedMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</Text>
                            <TouchableOpacity onPress={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))} className="px-3 py-2">
                                <Text className={classFor('text-gray-800', 'text-gray-100')}>▶</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <DateInput date={startDate || new Date()} setDate={(d: Date) => setStartDate(d)} />
                            <DateInput date={endDate || new Date()} setDate={(d: Date) => setEndDate(d)} />
                        </View>
                    )}
                </View>
                {/* <View className="bg-white rounded-2xl p-4 my-4 shadow-lg flex-row items-center justify-between">
                    <View>
                        <Text className="text-lg font-semibold">Export to CSV</Text>
                            <Text className={classFor('text-sm text-gray-500 mt-1','text-sm text-gray-300 mt-1')}>Download your data as .csv</Text>
                    </View>
                    <TouchableOpacity onPress={exportCsv} disabled={loadingCsv} className="bg-gray-100 p-3 rounded-full">
                        {loadingCsv ? <ActivityIndicator /> : <Text>⬇️</Text>}
                    </TouchableOpacity>
                </View> */}

                <View className={`${classFor('bg-white','bg-neutral-800')} rounded-2xl p-4 my-4 shadow-lg flex-row items-center justify-between`}>
                    <View>
                        <Text className={classFor('text-lg font-semibold text-gray-800', 'text-lg font-semibold text-gray-100')}>Export Report (PDF)</Text>
                        <Text className={classFor('text-sm text-gray-500 mt-1','text-sm text-gray-300 mt-1')}>Generate PDF for the selected range</Text>
                    </View>
                    <TouchableOpacity onPress={exportMonthlyPdf} disabled={loadingPdf} className="bg-gray-100 p-3 rounded-full">
                        {loadingPdf ? <ActivityIndicator /> : <Text>⬇️</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
