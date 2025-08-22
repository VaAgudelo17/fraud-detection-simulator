"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Shield, AlertTriangle, DollarSign, Target } from "lucide-react"
import Papa from "papaparse"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface FraudResult {
  Time: string
  Amount: number
  Real_Class: number
  Pred_Class: number
  Fraud_Prob: number
  Risk_Level: string
  Action: string
  Expected_Savings: number
  Investigation_Cost: number
}

interface EconomicAnalysis {
  "Fraudes Detectados (TP)": number
  "Fraudes No Detectados (FN)": number
  "Falsos Positivos (FP)": number
  "Verdaderos Negativos (TN)": number
  "Monto Detectado (pesos)": number
  "Monto Perdido (pesos)": number
  "Costo Investigaciones (pesos)": number
  "Beneficio Neto (pesos)": number
  "ROI (%)": number
  Precisión: number
}

export default function FraudDetectionDashboard() {
  const [fraudResults, setFraudResults] = useState<FraudResult[]>([])
  const [economicData, setEconomicData] = useState<EconomicAnalysis | null>(null)
  const [threshold, setThreshold] = useState([0.5])
  const [investigationCost, setInvestigationCost] = useState(18000)
  const [recoveryRate, setRecoveryRate] = useState(100)
  const [riskFilter, setRiskFilter] = useState<string>("all")
  const [actionFilter, setActionFilter] = useState<string>("all")

  const metrics = useMemo(() => {
    if (fraudResults.length === 0) return null

    const currentThreshold = threshold[0]
    let tp = 0,
      fp = 0,
      tn = 0,
      fn = 0
    let detectedAmount = 0,
      lostAmount = 0

    fraudResults.forEach((row) => {
      const predicted = row.Fraud_Prob >= currentThreshold ? 1 : 0
      const actual = row.Real_Class

      if (predicted === 1 && actual === 1) {
        tp++
        detectedAmount += row.Amount * (recoveryRate / 100)
      } else if (predicted === 1 && actual === 0) {
        fp++
      } else if (predicted === 0 && actual === 0) {
        tn++
      } else if (predicted === 0 && actual === 1) {
        fn++
        lostAmount += row.Amount
      }
    })

    const totalInvestigationCost = (tp + fp) * investigationCost
    const netBenefit = detectedAmount - totalInvestigationCost - lostAmount
    const roi = totalInvestigationCost > 0 ? (netBenefit / totalInvestigationCost) * 100 : 0
    const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : 0

    return {
      tp,
      fp,
      tn,
      fn,
      detectedAmount,
      lostAmount,
      totalInvestigationCost,
      netBenefit,
      roi,
      precision,
      confusionMatrix: [
        { name: "Verdaderos Positivos", value: tp, color: "#10b981" },
        { name: "Falsos Positivos", value: fp, color: "#f59e0b" },
        { name: "Verdaderos Negativos", value: tn, color: "#3b82f6" },
        { name: "Falsos Negativos", value: fn, color: "#ef4444" },
      ],
      economicComparison: [
        { scenario: "Sin Modelo", benefit: -(lostAmount + detectedAmount), cost: 0 },
        { scenario: "Con Modelo", benefit: netBenefit, cost: totalInvestigationCost },
      ],
    }
  }, [fraudResults, threshold, investigationCost, recoveryRate])

  const filteredTransactions = useMemo(() => {
    return fraudResults.filter(
      (row) =>
        (riskFilter === "all" || row.Risk_Level === riskFilter) &&
        (actionFilter === "all" || row.Action === actionFilter),
    )
  }, [fraudResults, riskFilter, actionFilter])

  const handleFileUpload = (file: File, type: "fraud" | "economic") => {
    Papa.parse(file, {
      complete: (results) => {
        if (type === "fraud") {
          const data = results.data.slice(1).map((row: any) => ({
            Time: row[0],
            Amount: Number.parseFloat(row[1]) || 0,
            Real_Class: Number.parseInt(row[2]) || 0,
            Pred_Class: Number.parseInt(row[3]) || 0,
            Fraud_Prob: Number.parseFloat(row[4]) || 0,
            Risk_Level: row[5] || "Bajo",
            Action: row[6] || "Accept",
            Expected_Savings: Number.parseFloat(row[7]) || 0,
            Investigation_Cost: Number.parseFloat(row[8]) || 0,
          }))
          setFraudResults(data)
        } else {
          const data = results.data[1]
          setEconomicData({
            "Fraudes Detectados (TP)": Number.parseInt(data[0]) || 0,
            "Fraudes No Detectados (FN)": Number.parseInt(data[1]) || 0,
            "Falsos Positivos (FP)": Number.parseInt(data[2]) || 0,
            "Verdaderos Negativos (TN)": Number.parseInt(data[3]) || 0,
            "Monto Detectado (pesos)": Number.parseFloat(data[4]) || 0,
            "Monto Perdido (pesos)": Number.parseFloat(data[5]) || 0,
            "Costo Investigaciones (pesos)": Number.parseFloat(data[6]) || 0,
            "Beneficio Neto (pesos)": Number.parseFloat(data[7]) || 0,
            "ROI (%)": Number.parseFloat(data[8]) || 0,
            Precisión: Number.parseFloat(data[9]) || 0,
          })
        }
      },
      header: false,
      skipEmptyLines: true,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Simulador de Detección de Fraude
                </h1>
                <p className="text-slate-600 mt-1">Panel de Análisis Interactivo</p>
              </div>
            </div>
            <Badge variant="secondary" className="px-4 py-2 bg-blue-100 text-blue-800 border-blue-200">
              Análisis en Tiempo Real
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              Carga de Datos
            </CardTitle>
            <CardDescription className="text-slate-600">
              Sube tus archivos CSV para iniciar el análisis de detección de fraude
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="fraud-file" className="text-sm font-semibold text-slate-700">
                  Resultados de Detección de Fraude CSV
                </Label>
                <Input
                  id="fraud-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, "fraud")
                  }}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="economic-file" className="text-sm font-semibold text-slate-700">
                  Análisis Económico CSV
                </Label>
                <Input
                  id="economic-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, "economic")
                  }}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {fraudResults.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  Simulación de Umbral
                </CardTitle>
                <CardDescription>Ajusta el umbral de detección para optimizar el rendimiento</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Umbral de Probabilidad: {threshold[0].toFixed(2)}</Label>
                  <Slider
                    value={threshold}
                    onValueChange={setThreshold}
                    max={0.99}
                    min={0.01}
                    step={0.01}
                    className="mt-2"
                  />
                </div>

                {metrics && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                        <div className="text-2xl font-bold text-green-700">{metrics.tp}</div>
                        <div className="text-xs text-green-600 font-medium">Verdaderos Positivos</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                        <div className="text-2xl font-bold text-amber-700">{metrics.fp}</div>
                        <div className="text-xs text-amber-600 font-medium">Falsos Positivos</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <div className="text-2xl font-bold text-blue-700">{metrics.tn}</div>
                        <div className="text-xs text-blue-600 font-medium">Verdaderos Negativos</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                        <div className="text-2xl font-bold text-red-700">{metrics.fn}</div>
                        <div className="text-xs text-red-600 font-medium">Falsos Negativos</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">ROI:</span>
                        <span className={`font-bold text-lg ${metrics.roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {metrics.roi.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Precisión:</span>
                        <span className="font-bold text-lg text-blue-600">{metrics.precision.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Beneficio Neto:</span>
                        <span
                          className={`font-bold text-lg ${metrics.netBenefit >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          ${metrics.netBenefit.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={metrics.confusionMatrix}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={85}
                            dataKey="value"
                          >
                            {metrics.confusionMatrix.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  Impacto Económico
                </CardTitle>
                <CardDescription>Análisis financiero y parámetros económicos</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {economicData && (
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="font-semibold mb-3 text-slate-800 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Datos del CSV Cargado
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white/60 rounded-lg p-2">
                        <span className="text-slate-600">TP:</span>{" "}
                        <span className="font-semibold">{economicData["Fraudes Detectados (TP)"]}</span>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <span className="text-slate-600">FN:</span>{" "}
                        <span className="font-semibold">{economicData["Fraudes No Detectados (FN)"]}</span>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <span className="text-slate-600">FP:</span>{" "}
                        <span className="font-semibold">{economicData["Falsos Positivos (FP)"]}</span>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <span className="text-slate-600">TN:</span>{" "}
                        <span className="font-semibold">{economicData["Verdaderos Negativos (TN)"]}</span>
                      </div>
                      <div className="col-span-2 bg-green-50 rounded-lg p-2 border border-green-200">
                        <span className="text-green-700 font-medium">Beneficio Neto:</span>
                        <span className="font-bold text-green-800">
                          {" "}
                          ${economicData["Beneficio Neto (pesos)"].toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="investigation-cost" className="text-sm font-semibold text-slate-700">
                      Costo de Investigación ($)
                    </Label>
                    <Input
                      id="investigation-cost"
                      type="number"
                      value={investigationCost}
                      onChange={(e) => setInvestigationCost(Number(e.target.value))}
                      className="border-slate-300 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recovery-rate" className="text-sm font-semibold text-slate-700">
                      Tasa de Recuperación (%)
                    </Label>
                    <Input
                      id="recovery-rate"
                      type="number"
                      value={recoveryRate}
                      onChange={(e) => setRecoveryRate(Number(e.target.value))}
                      min="0"
                      max="100"
                      className="border-slate-300 focus:border-blue-500"
                    />
                  </div>
                </div>

                {metrics && (
                  <>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.economicComparison}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="scenario" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value) => [`$${Number(value).toLocaleString()}`, "Beneficio"]}
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar dataKey="benefit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                      <h4 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Métricas Calculadas (Umbral: {threshold[0].toFixed(2)})
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white/60 rounded-lg p-2">
                          <span className="text-blue-600">Detectado:</span>
                          <span className="font-semibold"> ${metrics.detectedAmount.toLocaleString()}</span>
                        </div>
                        <div className="bg-white/60 rounded-lg p-2">
                          <span className="text-blue-600">Perdido:</span>
                          <span className="font-semibold"> ${metrics.lostAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  Monitoreo de Riesgo
                </CardTitle>
                <CardDescription>Transacciones de alto riesgo y filtros avanzados</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger className="border-slate-300 focus:border-orange-500">
                      <SelectValue placeholder="Nivel de Riesgo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Niveles</SelectItem>
                      <SelectItem value="Alto">🔴 Riesgo Alto</SelectItem>
                      <SelectItem value="Medio">🟡 Riesgo Medio</SelectItem>
                      <SelectItem value="Bajo">🟢 Riesgo Bajo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="border-slate-300 focus:border-orange-500">
                      <SelectValue placeholder="Acción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las Acciones</SelectItem>
                      <SelectItem value="Block">🚫 Bloquear</SelectItem>
                      <SelectItem value="Review">👁️ Revisar</SelectItem>
                      <SelectItem value="Accept">✅ Aceptar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-3">
                  {filteredTransactions.slice(0, 15).map((transaction, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                        transaction.Risk_Level === "Alto"
                          ? "bg-gradient-to-r from-red-50 to-pink-50 border-red-200 hover:border-red-300"
                          : transaction.Risk_Level === "Medio"
                            ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-300"
                            : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-bold text-lg text-slate-800">${transaction.Amount.toLocaleString()}</div>
                          <div className="text-sm text-slate-600">
                            Probabilidad: {(transaction.Fraud_Prob * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge
                            variant={
                              transaction.Risk_Level === "Alto"
                                ? "destructive"
                                : transaction.Risk_Level === "Medio"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="font-semibold"
                          >
                            {transaction.Risk_Level}
                          </Badge>
                          <div className="text-sm font-medium text-slate-700">{transaction.Action}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
