import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface PermissionMatrixProps {
  allPermissions: Permission[];
  selectedPermissions: Set<string>;
  onSelectionChange: (newSelection: Set<string>) => void;
}

const ACTIONS = ['create', 'read.own', 'read.all', 'update.own', 'update.all', 'delete.own', 'delete.all', 'export', 'import', 'assign', 'manage', 'read.sensitive'];
const RESOURCES = ['leads', 'opportunities', 'users', 'settings', 'finance', 'tickets', 'activities'];

export const PermissionMatrix = ({ allPermissions, selectedPermissions, onSelectionChange }: PermissionMatrixProps) => {
  const permissionMap = new Map(allPermissions.map(p => [p.name, p]));

  const handleToggle = (permissionName: string) => {
    const newSelection = new Set(selectedPermissions);
    if (newSelection.has(permissionName)) {
      newSelection.delete(permissionName);
    } else {
      newSelection.add(permissionName);
    }
    onSelectionChange(newSelection);
  };

  return (
    <ScrollArea className="whitespace-nowrap rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Módulo</TableHead>
            {ACTIONS.map(action => <TableHead key={action} className="text-center">{action}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {RESOURCES.map(resource => (
            <TableRow key={resource}>
              <TableCell className="font-medium capitalize">{resource}</TableCell>
              {ACTIONS.map(action => {
                const permissionName = `${resource}.${action}`;
                const permission = permissionMap.get(permissionName);
                return (
                  <TableCell key={action} className="text-center">
                    {permission ? (
                      <Checkbox
                        checked={selectedPermissions.has(permissionName)}
                        onCheckedChange={() => handleToggle(permissionName)}
                        aria-label={`Permissão ${permissionName}`}
                      />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};