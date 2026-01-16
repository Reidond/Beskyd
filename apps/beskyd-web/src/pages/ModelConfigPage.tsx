import { useQuery } from "@tanstack/react-query"
import type { RiskModelConfig } from "beskyd"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiFetch } from "@/lib/api"

interface ConfigResponse {
  id: string
  version: string
  config: RiskModelConfig
}

export function ModelConfigPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["risk-model-config"],
    queryFn: async () => apiFetch<ConfigResponse>("/v1/config/risk-model"),
  })

  if (isLoading) {
    return <div>Loading configuration…</div>
  }

  if (error) {
    return <div className="text-destructive">Unable to load configuration.</div>
  }

  const config = data?.config
  if (!config) {
    return <div>No configuration available.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Model configuration</h1>
          <p className="text-sm text-muted-foreground">Active version: {data?.version}</p>
        </div>
        <Button disabled>Save changes</Button>
      </div>

      <Tabs defaultValue="thresholds">
        <TabsList>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
          <TabsTrigger value="weights">Weights</TabsTrigger>
          <TabsTrigger value="expert">Expert scale</TabsTrigger>
        </TabsList>

        <TabsContent value="thresholds">
          <Card>
            <CardHeader>
              <CardTitle>Risk thresholds</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Very high max</Label>
                <Input value={config.thresholds.veryHighMax} readOnly />
              </div>
              <div className="space-y-2">
                <Label>High max</Label>
                <Input value={config.thresholds.highMax} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Medium max</Label>
                <Input value={config.thresholds.mediumMax} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Low max</Label>
                <Input value={config.thresholds.lowMax} readOnly />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weights">
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Configure weights for participant or group inputs.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expert">
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Expert scale breakpoints: {config.expertScale.breakpoints.join(", ")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
