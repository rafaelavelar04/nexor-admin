import * as React from "react";
import { ColumnDef, SortingState, flexRender, getCoreRowModel, useReactTable, PaginationState } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  users: { id: string; full_name: string }[];
}

export function AuditLogDataTable<TData, TValue>({ columns, users }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "created_at", desc: true }]);
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<string | "all">("all");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['audit_logs', pagination, sorting, debouncedSearchTerm, selectedUser, dateRange],
    queryFn: async () => {
      const toDate = dateRange?.to ? new Date(dateRange.to) : null;
      if (toDate) toDate.setHours(23, 59, 59, 999);

      const { data, error } = await supabase.rpc('get_audit_logs_for_admin', {
        page_limit: pagination.pageSize,
        page_offset: pagination.pageIndex * pagination.pageSize,
        sort_column: sorting[0]?.id || 'created_at',
        sort_direction: sorting[0]?.desc ? 'desc' : 'asc',
        search_term: debouncedSearchTerm || null,
        user_id_filter: selectedUser === 'all' ? null : selectedUser,
        start_date: dateRange?.from ? dateRange.from.toISOString() : null,
        end_date: toDate ? toDate.toISOString() : null,
      });

      if (error) throw error;
      return data;
    },
  });

  const pageCount = data?.count ? Math.ceil(data.count / pagination.pageSize) : 0;

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    manualPagination: true,
    manualSorting: true,
    pageCount,
    state: { sorting, pagination },
  });

  return (
    <div>
      <div className="flex items-center justify-between py-4 gap-2 flex-wrap">
        <Input
          placeholder="Filtrar por ação ou entidade..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Usuário" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Usuários</SelectItem>
              {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}` : format(dateRange.from, "dd/MM/yyyy")) : <span>Selecione um período</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar initialFocus mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={ptBR} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center"><Loader2 className="mx-auto w-6 h-6 animate-spin" /></TableCell></TableRow>
            ) : isError ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                <div className="flex flex-col items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  <span>Erro ao carregar os logs de auditoria.</span>
                  <small className="text-muted-foreground">{error.message}</small>
                </div>
              </TableCell></TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Nenhum log encontrado para os filtros aplicados.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Total de {data?.count ?? 0} logs.
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Próximo</Button>
        </div>
      </div>
    </div>
  );
}