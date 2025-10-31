import React from "react";

export default function Header() {
    return (
        <header className="bg-white py-4 shadow">
            <div className="max-w-6xl mx-auto flex justify-between items-center px-4">
                <div className="flex items-center gap-2">
                    <img src="/src/assets/logo.png" alt="Flytics" className="h-8" />
                    <span className="font-bold text-lg text-[#3693C3]">Flytics</span>
                </div>
                <nav className="space-x-6 text-sm text-gray-500">
                    <a href="#" className="hover:underline">Como funciona</a>
                    <a href="#" className="hover:underline">Contato</a>
                </nav>
            </div>
        </header>
    );
}
