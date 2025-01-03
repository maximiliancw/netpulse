import React, { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

interface Settings {
  theme: 'dark' | 'light' | 'system';
  graphSettings: {
    particleCount: number;
    particleSpeed: number;
    nodeSize: number;
    linkWidth: number;
    cooldownTicks: number;
    maxZoom: number;
  };
  colors: {
    activeNode: string;
    inactiveNode: string;
    links: string;
  };
}

const defaultSettings: Settings = {
  theme: 'system',
  graphSettings: {
    particleCount: 2,
    particleSpeed: 0.005,
    nodeSize: 6,
    linkWidth: 1,
    cooldownTicks: 50,
    maxZoom: 10,
  },
  colors: {
    activeNode: '#3B82F6',
    inactiveNode: '#10B981',
    links: '#94A3B8',
  },
};

export function Settings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const savedSettings = localStorage.getItem('netpulse-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('netpulse-settings', JSON.stringify(settings));
  }, [settings]);

  const handleThemeChange = (theme: Settings['theme']) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const handleGraphSettingChange = (key: keyof Settings['graphSettings'], value: number) => {
    setSettings(prev => ({
      ...prev,
      graphSettings: {
        ...prev.graphSettings,
        [key]: value,
      },
    }));
  };

  const handleColorChange = (key: keyof Settings['colors'], value: string) => {
    setSettings(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">Theme Preferences</h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleThemeChange('light')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
              settings.theme === 'light'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Sun className="h-4 w-4" />
            Light
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
              settings.theme === 'dark'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Moon className="h-4 w-4" />
            Dark
          </button>
          <button
            onClick={() => handleThemeChange('system')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
              settings.theme === 'system'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Monitor className="h-4 w-4" />
            System
          </button>
        </div>
      </div>

      {/* Graph Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">Graph Settings</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Particle Count</label>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={settings.graphSettings.particleCount}
              onChange={(e) => handleGraphSettingChange('particleCount', Number(e.target.value))}
              className="mt-1.5 w-full"
            />
            <div className="mt-1 text-xs text-gray-500">
              {settings.graphSettings.particleCount}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Particle Speed</label>
            <input
              type="range"
              min="0.001"
              max="0.01"
              step="0.001"
              value={settings.graphSettings.particleSpeed}
              onChange={(e) => handleGraphSettingChange('particleSpeed', Number(e.target.value))}
              className="mt-1.5 w-full"
            />
            <div className="mt-1 text-xs text-gray-500">
              {settings.graphSettings.particleSpeed}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Node Size</label>
            <input
              type="range"
              min="2"
              max="12"
              step="1"
              value={settings.graphSettings.nodeSize}
              onChange={(e) => handleGraphSettingChange('nodeSize', Number(e.target.value))}
              className="mt-1.5 w-full"
            />
            <div className="mt-1 text-xs text-gray-500">
              {settings.graphSettings.nodeSize}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Link Width</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={settings.graphSettings.linkWidth}
              onChange={(e) => handleGraphSettingChange('linkWidth', Number(e.target.value))}
              className="mt-1.5 w-full"
            />
            <div className="mt-1 text-xs text-gray-500">
              {settings.graphSettings.linkWidth}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Max Zoom Level</label>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={settings.graphSettings.maxZoom}
              onChange={(e) => handleGraphSettingChange('maxZoom', Number(e.target.value))}
              className="mt-1.5 w-full"
            />
            <div className="mt-1 text-xs text-gray-500">
              {settings.graphSettings.maxZoom}x
            </div>
          </div>
        </div>
      </div>

      {/* Color Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">Colors</h3>
        <div className="grid gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Active Node</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={settings.colors.activeNode}
                onChange={(e) => handleColorChange('activeNode', e.target.value)}
                className="h-6 w-6 rounded"
              />
              <span className="text-xs text-gray-500">{settings.colors.activeNode}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Inactive Node</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={settings.colors.inactiveNode}
                onChange={(e) => handleColorChange('inactiveNode', e.target.value)}
                className="h-6 w-6 rounded"
              />
              <span className="text-xs text-gray-500">{settings.colors.inactiveNode}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Links</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={settings.colors.links}
                onChange={(e) => handleColorChange('links', e.target.value)}
                className="h-6 w-6 rounded"
              />
              <span className="text-xs text-gray-500">{settings.colors.links}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}