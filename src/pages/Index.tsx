
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import InvoiceForm from "@/components/InvoiceForm";
import InvoiceList from "@/components/InvoiceList";
import InvoiceImport from "@/components/InvoiceImport";
import MessageTemplates from "@/components/MessageTemplates";
import MessageHistory from "@/components/MessageHistory";
import Dashboard from "@/components/Dashboard";
import { Invoice, Message } from "@/types";
import { Send } from "lucide-react";

// Default template messages
const DEFAULT_REMINDER_TEMPLATE = 
`Olá {{nome}}, 

Esperamos que esteja bem! Este é apenas um lembrete amigável de que você possui uma fatura no valor de {{valor}} com vencimento em {{vencimento}}.

Para sua comodidade, você pode efetuar o pagamento através do link abaixo:
{{link}}

Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem.

Atenciosamente,
Equipe WhatZPay`;

const DEFAULT_OVERDUE_TEMPLATE = 
`Olá {{nome}},

Notamos que sua fatura no valor de {{valor}} venceu há {{diasAtraso}} dia(s), em {{vencimento}}, e consta como pendente em nosso sistema.

Para regularizar sua situação, por favor efetue o pagamento através do link abaixo:
{{link}}

Caso já tenha efetuado o pagamento, por favor nos informe para atualizarmos seu status.

Atenciosamente,
Equipe WhatZPay`;

const Index = () => {
  // State management for application data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageTemplates, setMessageTemplates] = useState({
    reminder: DEFAULT_REMINDER_TEMPLATE,
    overdue: DEFAULT_OVERDUE_TEMPLATE
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Load data from localStorage on mount
  useEffect(() => {
    const savedInvoices = localStorage.getItem('whatzpay-invoices');
    const savedMessages = localStorage.getItem('whatzpay-messages');
    const savedTemplates = localStorage.getItem('whatzpay-templates');
    
    if (savedInvoices) {
      try {
        setInvoices(JSON.parse(savedInvoices));
      } catch (e) {
        console.error("Failed to parse saved invoices");
      }
    }
    
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to parse saved messages");
      }
    }
    
    if (savedTemplates) {
      try {
        setMessageTemplates(JSON.parse(savedTemplates));
      } catch (e) {
        console.error("Failed to parse saved templates");
        // Use defaults if parsing fails
      }
    }
  }, []);
  
  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('whatzpay-invoices', JSON.stringify(invoices));
  }, [invoices]);
  
  useEffect(() => {
    localStorage.setItem('whatzpay-messages', JSON.stringify(messages));
  }, [messages]);
  
  useEffect(() => {
    localStorage.setItem('whatzpay-templates', JSON.stringify(messageTemplates));
  }, [messageTemplates]);
  
  // Handlers for updating data
  const handleAddInvoice = (invoice: Invoice) => {
    setInvoices(prev => [...prev, invoice]);
  };

  const handleAddInvoices = (newInvoices: Invoice[]) => {
    setInvoices(prev => [...prev, ...newInvoices]);
  };
  
  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === updatedInvoice.id ? updatedInvoice : invoice
    ));
  };
  
  const handleAddMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };
  
  const handleUpdateTemplates = (templates: { reminder: string; overdue: string }) => {
    setMessageTemplates(templates);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        {invoices.length === 0 && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <div className="bg-white p-5 rounded-full mb-6 shadow-md">
              <Send className="h-16 w-16 text-blue-500" />
            </div>
            <h1 className="text-4xl font-bold mb-2 text-center">Bem-vindo ao WhatZPay</h1>
            <p className="text-xl text-muted-foreground mb-8 text-center max-w-lg">
              Sistema de alertas e cobranças automáticas via WhatsApp
            </p>
            <Tabs defaultValue="invoices" className="w-full max-w-3xl">
              <TabsList>
                <TabsTrigger value="invoices">Cadastro Manual</TabsTrigger>
                <TabsTrigger value="import">Importação XLS</TabsTrigger>
              </TabsList>
              <TabsContent value="invoices">
                <InvoiceForm onAddInvoice={handleAddInvoice} />
              </TabsContent>
              <TabsContent value="import">
                <InvoiceImport onAddInvoices={handleAddInvoices} existingInvoices={invoices} />
              </TabsContent>
            </Tabs>
            <div className="mt-8 text-center">
              <p className="text-muted-foreground text-sm">
                Comece cadastrando suas primeiras faturas para enviar alertas de pagamento automáticos.
              </p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-6">
              <TabsList>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="invoices">Faturas</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="messages">Histórico</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="dashboard" className="space-y-6">
              <Dashboard 
                invoices={invoices} 
                messages={messages} 
                messageTemplates={messageTemplates}
                onAddMessage={handleAddMessage}
              />
            </TabsContent>
            
            <TabsContent value="invoices" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 lg:col-span-9">
                  <InvoiceList 
                    invoices={invoices} 
                    onUpdateInvoice={handleUpdateInvoice} 
                    onAddMessage={handleAddMessage}
                    messageTemplates={messageTemplates}
                  />
                </div>
                <div className="md:col-span-4 lg:col-span-3">
                  <Tabs defaultValue="manual" className="w-full">
                    <TabsList className="w-full grid grid-cols-2">
                      <TabsTrigger value="manual">Manual</TabsTrigger>
                      <TabsTrigger value="import">Importar</TabsTrigger>
                    </TabsList>
                    <TabsContent value="manual">
                      <InvoiceForm onAddInvoice={handleAddInvoice} />
                    </TabsContent>
                    <TabsContent value="import">
                      <InvoiceImport onAddInvoices={handleAddInvoices} existingInvoices={invoices} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="templates">
              <MessageTemplates 
                templates={messageTemplates} 
                onUpdateTemplates={handleUpdateTemplates} 
              />
            </TabsContent>
            
            <TabsContent value="messages">
              <MessageHistory messages={messages} />
            </TabsContent>
          </Tabs>
        )}
      </main>
      
      <footer className="py-4 px-4 border-t">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <div className="mb-2 md:mb-0">
            WhatZPay - Sistema de Alertas e Cobranças via WhatsApp
          </div>
          <div className="flex items-center">
            <span>Desenvolvido com</span>
            <span className="text-red-500 mx-1">♥</span>
            <span>por Lovable</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
