import { useForm } from "@tanstack/react-form"
import type { ExpertRegionAssessment } from "beskyd"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiFetch } from "@/lib/api"

const regions = ["zakarpattia", "lviv", "ivano-frankivsk"]

export function ExpertsFormPage() {
  const defaultRegion = regions[0] ?? ""
  const defaultValues: ExpertRegionAssessment = {
    regionId: defaultRegion,
    safetyLevel: "average",
  }

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await apiFetch("/v1/assessments/experts", {
        method: "POST",
        body: JSON.stringify([value]),
      })
      form.reset()
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expert assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field name="regionId">
            {(field) => (
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={field.state.value} onValueChange={field.handleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>
          <form.Field name="safetyLevel">
            {(field) => (
              <div className="space-y-2">
                <Label>Safety level</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value: string) =>
                    field.handleChange(value as ExpertRegionAssessment["safetyLevel"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="below_average">Below average</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="above_average">Above average</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>
          <Button type="submit">Submit assessment</Button>
        </form>
      </CardContent>
    </Card>
  )
}
