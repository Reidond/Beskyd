import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import type { RegionRiskResult } from "beskyd"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { apiFetch } from "@/lib/api"

interface RegionRiskResponse {
  regionId: string
  configVersion: string
  computedAt: string
  result: RegionRiskResult
}

export function RegionDetailPage() {
  const { regionId } = useParams({ from: "/regions/$regionId" })
  const { data, isLoading, error } = useQuery({
    queryKey: ["region-risk", regionId],
    queryFn: async () =>
      apiFetch<RegionRiskResponse>(
        `/v1/results/region-risk?regionId=${encodeURIComponent(regionId)}`,
      ),
  })

  if (isLoading) {
    return <div>Loading region risk data…</div>
  }

  if (error) {
    return <div className="text-destructive">Unable to load region data.</div>
  }

  const result = data?.result
  if (!result) {
    return <div>No risk data available.</div>
  }

  const metrics = [
    { label: "Sense of safety (m_S)", value: result.diagnostics.senseOfSafety },
    { label: "Repeat visit (Ξ)", value: result.diagnostics.repeatVisit },
    { label: "Expert level", value: result.diagnostics.expertSafetyLevel },
    { label: "Aggregated risk", value: result.diagnostics.deltaRisk / 100 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Region</div>
          <h1 className="text-3xl font-semibold capitalize">{regionId}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Risk index</div>
            <div className="text-2xl font-semibold">{result.riskIndex.toFixed(2)}</div>
          </div>
          <Badge>{result.riskLabel}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xl font-semibold">
                {typeof metric.value === "number" ? metric.value.toFixed(2) : metric.value}
              </div>
              {typeof metric.value === "number" ? <Progress value={metric.value * 100} /> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Sample size</span>
            <span className="font-semibold">{result.diagnostics.sampleSize}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Omega</span>
            <span className="font-semibold">{result.diagnostics.omega.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Mu_R</span>
            <span className="font-semibold">{result.diagnostics.muR.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
