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
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit_logs', pagination, sorting, debouncedSearchTerm, selectedUser, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*, user:profiles!user_id(full_name)', { count: 'exact' });

      if (debouncedSearchTerm) {
        query = query.or(`action.ilike.%${debouncedSearchTerm}%,entity.ilike.%${debouncedSearchTerm}%`);
      }
      if (selectedUser !== 'all') {
        query = query.eq('user_id', selectedUser);
      }
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999); // Include the whole day
        query = query.lte('created_at', toDate.toISOString());
      }

      query = query
        .order(sorting[0].id, { ascending: !sorting[0].desc })
        .range(pagination.pageIndex * pagination.pageSize, (pagination.pageIndex + 1) * pagination.pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
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
      <div className="rounded-md border">
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
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-destructive">Erro ao carregar logs.</TableCell></TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Nenhum log encontrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Próximo</Button>
      </div>
    </div>
  );
}