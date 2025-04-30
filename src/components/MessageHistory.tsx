
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Message } from "@/types";
import { formatDatetime } from "@/utils/dateUtils";

interface MessageHistoryProps {
  messages: Message[];
}

type FilteredStatus = 'all' | 'sent' | 'delivered' | 'read' | 'failed';

const MessageHistory: React.FC<MessageHistoryProps> = ({ messages }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilteredStatus>('all');

  const getStatusBadge = (status: Message['deliveryStatus']) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Enviada</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Entregue</Badge>;
      case 'read':
        return <Badge className="bg-green-500">Lida</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Pendente</Badge>;
    }
  };

  const getMessageTypeBadge = (type: Message['messageType']) => {
    switch (type) {
      case 'reminder':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Lembrete</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cobrança</Badge>;
      case 'manual':
        return <Badge variant="outline">Manual</Badge>;
    }
  };

  const filteredMessages = messages
    .filter(message => statusFilter === 'all' || message.deliveryStatus === statusFilter)
    .filter(message => 
      message.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.whatsappNumber.includes(searchTerm)
    )
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Histórico de Mensagens</CardTitle>
        <CardDescription>
          Histórico de mensagens enviadas pelo WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs defaultValue="all" value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilteredStatus)}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="sent">Enviados</TabsTrigger>
              <TabsTrigger value="failed">Falhas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {filteredMessages.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">Nenhuma mensagem encontrada.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id} className="group cursor-pointer" title="Clique para visualizar a mensagem">
                    <TableCell className="font-medium">{message.customerName}</TableCell>
                    <TableCell>{getMessageTypeBadge(message.messageType)}</TableCell>
                    <TableCell>{formatDatetime(message.sentAt)}</TableCell>
                    <TableCell>{getStatusBadge(message.deliveryStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {filteredMessages.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredMessages.length} de {messages.length} mensagens
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageHistory;
