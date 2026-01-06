
import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, children, icon }) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-200 flex items-center space-x-2">
        {icon}
        <h3 className="font-semibold text-gray-800 uppercase text-sm tracking-wide">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};
