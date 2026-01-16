import { Link } from "@tanstack/react-router"
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface RegionRow {
  id: string
  name: string
  riskIndex: number
  riskLabel: string
}

const sampleRows: RegionRow[] = [
  { id: "zakarpattia", name: "Zakarpattia", riskIndex: 0.86, riskLabel: "very_low" },
  { id: "lviv", name: "Lviv", riskIndex: 0.82, riskLabel: "very_low" },
  { id: "ivano-frankivsk", name: "Ivano-Frankivsk", riskIndex: 0.41, riskLabel: "medium" },
]

const columns: ColumnDef<RegionRow>[] = [
  {
    accessorKey: "name",
    header: "Region",
    cell: (info) => <span className="font-medium">{info.getValue<string>()}</span>,
  },
  {
    accessorKey: "riskIndex",
    header: "Risk Index",
    cell: (info) => info.getValue<number>().toFixed(2),
  },
  {
    accessorKey: "riskLabel",
    header: "Label",
    cell: (info) => <Badge variant="secondary">{info.getValue<string>()}</Badge>,
  },
  {
    id: "actions",
    header: "",
    cell: (info) => (
      <Button asChild size="sm" variant="ghost">
        <Link to="/regions/$regionId" params={{ regionId: info.row.original.id }}>
          View
        </Link>
      </Button>
    ),
  },
]

export function RegionsPage() {
  const table = useReactTable({
    data: sampleRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regional risk overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
