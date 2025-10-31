import React from "react";

export default function Footer() {
  return (
    <footer className="bg-white text-black border-t border-gray-200 mt-10">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-center text-center flex-wrap gap-1">
        <span className="font-semibold text-lg">Flytics </span>
        <span className="text-sm text-gray-600"> 
          © {new Date().getFullYear()} Todos os direitos reservados. Criado para tornar dados mais simples e acessíveis.
        </span>
      </div>
    </footer>
  );
}
