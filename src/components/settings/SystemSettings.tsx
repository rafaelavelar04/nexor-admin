import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SystemSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Sistema</CardTitle>
        <CardDescription>
          Gerencie as configurações globais da aplicação. (Funcionalidade em desenvolvimento)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="system-name">Nome do Sistema</Label>
          <Input id="system-name" placeholder="Nexor Admin" disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Fuso Horário</Label>
          <Select disabled>
            <SelectTrigger id="timezone">
              <SelectValue placeholder="America/Sao_Paulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gmt-3">America/Sao_Paulo (GMT-3)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Moeda Padrão</Label>
          <Select disabled>
            <SelectTrigger id="currency">
              <SelectValue placeholder="Real Brasileiro (BRL)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brl">Real Brasileiro (BRL)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button disabled>Salvar Alterações</Button>
      </CardFooter>
    </Card>
  );
};

export default SystemSettings;