import React from 'react';

export const AuthModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto p-4">
      <div className="relative bg-card text-card-foreground rounded-xl shadow-2xl border border-border w-full max-w-lg mx-auto my-8 p-6 sm:p-8 md:p-10">
        {/* The Card component styling is now part of this modal, children will be the form itself */} 
        {/* The close button from the original forms can be standardized here if needed, or kept within each form for specific aria-labels */} 
        {children}
      </div>
    </div>
  );
};