
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center px-4 sm:px-6">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-blue-100 p-1 rounded-full">
              <Send className="h-6 w-6 text-blue-500" />
            </div>
            <span className="text-xl font-bold">WhatZPay</span>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                Sobre
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sobre o WhatZPay</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <p className="mb-4">
                  WhatZPay é um sistema de alertas e cobranças automáticas via WhatsApp.
                </p>
                <p className="mb-4">
                  O sistema permite o envio de lembretes antes do vencimento de faturas
                  e cobranças após o vencimento, tudo de forma automatizada e personalizada.
                </p>
                <h3 className="font-bold mt-6 mb-2">Principais funcionalidades:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cadastro manual e importação de faturas via Excel</li>
                  <li>Envio automatizado de lembretes e cobranças</li>
                  <li>Detecção automática de pagamentos</li>
                  <li>Personalização completa de mensagens</li>
                  <li>Histórico de mensagens enviadas</li>
                </ul>
              </div>
              <div className="mt-auto pt-4">
                <Button
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  Fechar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
