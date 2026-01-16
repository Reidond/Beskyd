import { useForm } from "@tanstack/react-form"
import type { ParticipantAssessment } from "beskyd"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
const linguisticOptions = [
  { value: "l1", label: "L1" },
  { value: "l2", label: "L2" },
  { value: "l3", label: "L3" },
  { value: "l4", label: "L4" },
  { value: "l5", label: "L5" },
]

const infrastructureKeys = ["K1", "K2", "K3", "K4", "K5"]
const socioKeys = ["K6", "K7", "K8", "K9", "K10", "K11", "K12"]
const medicalKeys = ["K13", "K14", "K15", "K16", "K17"]

const buildCriteria = (keys: string[]) =>
  keys.reduce<Record<string, string>>((accumulator, key) => {
    accumulator[key] = "l3"
    return accumulator
  }, {})

export function ParticipantsFormPage() {
  const defaultRegion = regions[0] ?? ""
  const [criteria, setCriteria] = useState<ParticipantAssessment["criteria"]>({
    infrastructure: buildCriteria(infrastructureKeys),
    socioEcological: buildCriteria(socioKeys),
    medical: buildCriteria(medicalKeys),
  })

  const form = useForm({
    defaultValues: {
      participantId: "",
      regionId: defaultRegion,
    },
    onSubmit: async ({ value }) => {
      const payload: ParticipantAssessment = {
        participantId: value.participantId,
        regionId: value.regionId,
        criteria,
      }

      await apiFetch("/v1/assessments/participants", {
        method: "POST",
        body: JSON.stringify([payload]),
      })
      form.reset()
      setCriteria({
        infrastructure: buildCriteria(infrastructureKeys),
        socioEcological: buildCriteria(socioKeys),
        medical: buildCriteria(medicalKeys),
      })
    },
  })

  const updateCriteria = (
    group: keyof ParticipantAssessment["criteria"],
    key: string,
    value: string,
  ) => {
    setCriteria((previous) => ({
      ...previous,
      [group]: {
        ...previous[group],
        [key]: value,
      },
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participant assessment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field name="participantId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Participant ID</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </div>
            )}
          </form.Field>
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

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Infrastructure</h3>
            {infrastructureKeys.map((key) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <Label>{key}</Label>
                <Select
                  value={criteria.infrastructure?.[key] ?? "l3"}
                  onValueChange={(value: string) => updateCriteria("infrastructure", key, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {linguisticOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Socio-ecological</h3>
            {socioKeys.map((key) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <Label>{key}</Label>
                <Select
                  value={criteria.socioEcological?.[key] ?? "l3"}
                  onValueChange={(value: string) => updateCriteria("socioEcological", key, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {linguisticOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Medical</h3>
            {medicalKeys.map((key) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <Label>{key}</Label>
                <Select
                  value={criteria.medical?.[key] ?? "l3"}
                  onValueChange={(value: string) => updateCriteria("medical", key, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {linguisticOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <Button type="submit">Submit assessment</Button>
        </form>
      </CardContent>
    </Card>
  )
}
