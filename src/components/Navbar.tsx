
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { whatsapp } from "lucide-react";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <nav className="bg-primary text-primary-foreground shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-white rounded-full p-1.5">
                <whatsapp className="h-6 w-6 text-whatsapp" />
              </div>
              <span className="text-xl font-bold">WhatZPay</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center">
            <div className="ml-4 flex items-center space-x-2">
              <Link to="/">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link to="/invoices">
                <Button variant="ghost">Faturas</Button>
              </Link>
              <Link to="/templates">
                <Button variant="ghost">Templates</Button>
              </Link>
              <Link to="/messages">
                <Button variant="ghost">Histórico</Button>
              </Link>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-700">
              Dashboard
            </Link>
            <Link to="/invoices" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-700">
              Faturas
            </Link>
            <Link to="/templates" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-700">
              Templates
            </Link>
            <Link to="/messages" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-700">
              Histórico
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
