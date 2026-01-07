
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { INITIAL_USERS } from '../constants';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (user: typeof INITIAL_USERS[0]) => {
    login(user);
    if (user.role === 'Director') navigate('/director');
    if (user.role === 'Manager') navigate('/manager');
    if (user.role === 'Employee') navigate('/employee');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">ImpactLens</h1>
          <p className="mt-2 text-slate-600">AI-Powered Developer Intelligence Platform</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-6 text-center">Select Role to Demo</h2>
          <div className="space-y-4">
            {INITIAL_USERS.map((u) => (
              <button
                key={u.user_id}
                onClick={() => handleLogin(u)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{u.name}</p>
                    <p className="text-sm text-slate-500 uppercase tracking-wide font-medium">{u.role}</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="font-bold">Hackathon Prototype:</span> This mock login bypasses real auth. In production, this would use OAuth for secure GitHub access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
