import { ColumnDef } from "@tanstack/react-table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  active: boolean;
};

interface UsersTableColumnsProps {
  onRoleChange: (userId: string, newRole: string) => void;
  onStatusChange: (user: User, newStatus: boolean) => void;
  currentUserId: string;
}

export const UsersTableColumns = ({ onRoleChange, onStatusChange, currentUserId }: UsersTableColumnsProps): ColumnDef<User>[] => [
  {
    accessorKey: "full_name",
    header: "Nome",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.full_name}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Permissão",
    cell: ({ row }) => {
      const user = row.original;
      const isCurrentUser = user.id === currentUserId;
      const roles = ['admin', 'vendas', 'operacoes', 'viewer'];

      return (
        <Select
          value={user.role}
          onValueChange={(newRole) => onRoleChange(user.id, newRole)}
          disabled={isCurrentUser}
        >
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Selecione a permissão" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {roles.map(role => (
              <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const user = row.original;
      const isCurrentUser = user.id === currentUserId;

      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={user.active}
            onCheckedChange={(newStatus) => onStatusChange(user, newStatus)}
            disabled={isCurrentUser}
            aria-readonly={isCurrentUser}
          />
          <Badge variant={user.active ? "default" : "destructive"} className={user.active ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}>
            {user.active ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      );
    },
  },
];