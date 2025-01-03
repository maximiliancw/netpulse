import React, { useState } from 'react';
import { Activity, Settings as SettingsIcon, X } from 'lucide-react';
import { Settings } from '../Settings';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-30 h-16 border-b border-gray-200 bg-white">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold text-blue-600">NetPulse</span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            <SettingsIcon className="h-5 w-5" />
            Settings
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mt-8 min-h-[calc(100vh-4rem)]">
        <div className="px-2 py-8 overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* Settings Sidebar */}
      <div
        className={`fixed right-0 top-0 z-40 h-screen w-96 transform overflow-y-auto bg-white shadow-lg transition-transform duration-300 ease-in-out ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <Settings />
        </div>
      </div>

      {/* Overlay */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}