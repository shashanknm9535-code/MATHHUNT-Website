'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { BackendBanner } from './BackendBanner';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  requiredEndpoint?: string;
  method?: string;
  isDangerous?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  requiredEndpoint,
  method = 'POST',
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-cyber-card border border-cyber-border rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-cyber-border bg-slate-900/60">
          <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
            {isDangerous && <AlertTriangle className="w-5 h-5 text-red-400" />}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {requiredEndpoint && (
            <BackendBanner
              endpoint={requiredEndpoint}
              method={method}
              description="Executing this action will require real NestJS backend processing when connected."
            />
          )}
          {children}
        </div>
      </div>
    </div>
  );
};
