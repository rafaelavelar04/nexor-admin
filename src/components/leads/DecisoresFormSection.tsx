import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const DecisoresFormSection = () => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "decisores",
  });

  return (
    <Card className="bg-secondary/50">
      <CardHeader>
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Sócios / Decisores</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => append({ nome: "", telefone: "", instagram: "", cargo: "" })}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Adicionar Decisor
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum decisor adicionado.</p>
        )}
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-md relative space-y-4 bg-background/50">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 text-destructive"
              onClick={() => remove(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name={`decisores.${index}.nome`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl><Input placeholder="Nome do decisor" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`decisores.${index}.cargo`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl><Input placeholder="Cargo" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`decisores.${index}.telefone`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl><Input placeholder="Telefone" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`decisores.${index}.instagram`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl><Input placeholder="@usuario" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};