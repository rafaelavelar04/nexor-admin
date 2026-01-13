import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

type UserProfile = { id: string; full_name: string; };

export function ActivitiesDataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "activity_date", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [date, setDate] = React.useState<DateRange | undefined>()

  const { data: users } = useQuery<UserProfile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });

  React.useEffect(() => {
    table.getColumn("activity_date")?.setFilterValue(date);
  }, [date, table]);

  const activityTypes = ["Email", "Call", "Meeting"];

  return (
    <div>
      <div className="flex items-center justify-between py-4 gap-2 flex-wrap">
        <Input
          placeholder="Filtrar por descrição..."
          value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("description")?.setFilterValue(event.target.value)}
          className="max-w-sm bg-secondary border-border"
        />
        <div className="flex items-center space-x-2">
          <Select
            value={(table.getColumn("user")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) => table.getColumn("user")?.setFilterValue(value === "all" ? undefined : value)}
          >
            <SelectTrigger className="w-[180px] bg-secondary border-border">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users?.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            value={(table.getColumn("type")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) => table.getColumn("type")?.setFilterValue(value === "all" ? undefined : value)}
          >
            <SelectTrigger className="w-[150px] bg-secondary border-border">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {activityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-[280px] justify-start text-left font-normal bg-secondary border-border", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Selecione um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border hover:bg-secondary/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-foreground">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="border-border hover:bg-secondary/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">Nenhuma atividade encontrada.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Próximo</Button>
      </div>
    </div>
  )
}