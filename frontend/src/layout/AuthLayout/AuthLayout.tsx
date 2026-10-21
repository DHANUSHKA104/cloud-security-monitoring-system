import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-950">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white font-bold text-lg mb-2">
          CS
        </div>
        <h1 className="text-xl font-bold text-gray-100">CloudSec Incident Monitor</h1>
        <p className="text-xs text-gray-400 mt-1">
          Security Operations & Incident Routing Platform
        </p>
      </div>

      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-xl">
        <Outlet />
      </div>

      <div className="mt-6 text-center text-[11px] text-gray-500">
        Infosys Springboard Internship | Simulated Environment
      </div>
    </div>
  );
};
