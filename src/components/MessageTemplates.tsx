
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MessageTemplatesProps {
  templates: {
    reminder: string;
    overdue: string;
  };
  onUpdateTemplates: (templates: { reminder: string; overdue: string }) => void;
}

const MessageTemplates: React.FC<MessageTemplatesProps> = ({ templates, onUpdateTemplates }) => {
  const { toast } = useToast();
  const [reminderTemplate, setReminderTemplate] = useState(templates.reminder);
  const [overdueTemplate, setOverdueTemplate] = useState(templates.overdue);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (type: 'reminder' | 'overdue') => {
    setIsSaving(true);
    
    setTimeout(() => {
      if (type === 'reminder') {
        onUpdateTemplates({
          ...templates,
          reminder: reminderTemplate
        });
      } else {
        onUpdateTemplates({
          ...templates,
          overdue: overdueTemplate
        });
      }
      
      toast({
        title: "Template atualizado",
        description: "O template foi salvo com sucesso."
      });
      
      setIsSaving(false);
    }, 500);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Modelos de Mensagem</CardTitle>
        <CardDescription>
          Configure os modelos de mensagem para alertas e cobranças.
        </CardDescription>
      </CardHeader>
      <Tabs defaultValue="reminder">
        <CardContent>
          <TabsList className="mb-4">
            <TabsTrigger value="reminder">Lembrete de Vencimento</TabsTrigger>
            <TabsTrigger value="overdue">Cobrança de Atraso</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reminder" className="space-y-4">
            <div>
              <div className="mb-4">
                <Label>Modelo de Lembrete de Vencimento</Label>
                <Textarea
                  value={reminderTemplate}
                  onChange={(e) => setReminderTemplate(e.target.value)}
                  rows={8}
                  className="mt-2"
                />
              </div>
              
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-1">Variáveis disponíveis:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="text-xs">
                    <code className="bg-muted-foreground/20 p-1 rounded">{"{{nome}}"}</code> - Nome do cliente
                  </div>
                  <div className="text-xs">
                    <code className="bg-muted-foreground/20 p-1 rounded">{"{{valor}}"}</code> - Valor da fatura
                  </div>
                  <div className="text-xs">
                    <code className="bg-muted-foreground/20 p-1 rounded">{"{{vencimento}}"}</code> - Data de vencimento
                  </div>
                  <div className="text-xs">
                    <code className="bg-muted-foreground/20 p-1 rounded">{"{{link}}"}</code> - Link de pagamento
                  </div>
                </div>
              </div>
            </div>
            
            <CardFooter className="px-0">
              <Button
                onClick={() => handleSave('reminder')}
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar Modelo"}
              </Button>
            </CardFooter>
          </TabsContent>
          
          <TabsContent value="overdue" className="space-y-4">
            <div>
              <div className="mb-4">
                <Label>Modelo de Cobrança de Atraso</Label>
                <Textarea
                  value={overdueTemplate}
                  onChange={(e) => setOverdueTemplate(e.target.value)}
                  rows={8}
                  className="mt-2"
                />
              </div>
              
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-1">Variáveis disponíveis:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="text-xs">
                    <code className="bg-muted-foreground/20 p-1 rounded">{"{{nome}}"}</code> - Nome do cliente
                  </div>
                  <div className="text-xs">
                    <code className="bg-muted-foreground/20 p-1 rounded">{"{{valor}}"}</code> - Valor da fatura
                  </div>
                  <div className="text-xs">
                    <code className="bg-muted-foreground/20 p-1 rounded">{"{{vencimento}}"}</code> - Data de vencimento
                  </div>
                  <div className="text-xs">
                    <code className="bg-muted-foreground/20 p-1 rounded">{"{{diasAtraso}}"}</code> - Dias em atraso
                  </div>
                  <div className="text-xs">
                    <code className="bg-muted-foreground/20 p-1 rounded">{"{{link}}"}</code> - Link de pagamento
                  </div>
                </div>
              </div>
            </div>
            
            <CardFooter className="px-0">
              <Button
                onClick={() => handleSave('overdue')}
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar Modelo"}
              </Button>
            </CardFooter>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default MessageTemplates;
