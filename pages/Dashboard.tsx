import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Clock, CheckCircle, AlertTriangle, CloudOff, ArrowUpDown } from 'lucide-react';
import { IncidentStatus, Incident } from '../types';
import { fetchIncidents, isNCConfigured } from '../services/nextcloudService';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isNCConfigured());

  const loadData = async () => {
    if (!isNCConfigured()) {
      setLoading(false);
      setIsConfigured(false);
      return;
    }
    try {
      setLoading(true);
      setIsConfigured(true);
      const data = await fetchIncidents();
      setIncidents(data);
    } catch (e) {
      console.error("Failed to load incidents", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openIncidents = incidents.filter(i => i.status === IncidentStatus.OPEN).length;
  const monitoringIncidents = incidents.filter(i => i.status === IncidentStatus.MONITORING).length;
  const recentIncidents = [...incidents].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  const StatCard = ({ title, count, icon: Icon, colorClass, bgClass, targetStatus }: any) => (
    <div 
      onClick={() => { if(isConfigured) navigate(targetStatus ? `/incidents?status=${targetStatus}` : '/incidents') }}
      className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between ${isConfigured ? 'cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]' : 'opacity-50'}`}
    >
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{loading ? '...' : (isConfigured ? count : 0)}</p>
      </div>
      <div className={`p-4 rounded-full ${bgClass}`}>
        <Icon className={`w-8 h-8 ${colorClass}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 uppercase">CVO OBERSCHULE</h2>
          <p className="text-gray-500 mt-2">Schulzentrum Carl von Ossietzky, Oberschule - Bremerhaven</p>
        </div>
        {!isConfigured && !loading && (
          <div className="bg-amber-100 border border-amber-200 p-4 rounded-xl flex items-center space-x-3 shadow-sm animate-pulse">
            <CloudOff className="text-amber-600 w-6 h-6" />
            <div className="text-sm">
              <p className="font-bold text-amber-800">Setup erforderlich</p>
              <p className="text-amber-700">Nextcloud ist nicht konfiguriert.</p>
            </div>
          </div>
        )}
      </div>

      {!isConfigured && !loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-xl border border-blue-100 text-center space-y-6 max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Fast geschafft!</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Damit die App Ihre Daten sicher in Ihrer Nextcloud speichern kann, müssen Sie einmalig Ihre Zugangsdaten hinterlegen.
          </p>
          <button 
            onClick={() => navigate('/settings')}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center mx-auto"
          >
            Jetzt konfigurieren <ArrowUpDown className="ml-2 w-5 h-5 rotate-90" />
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Offene Konflikte" count={openIncidents} icon={AlertTriangle} colorClass="text-red-600" bgClass="bg-red-50" targetStatus={IncidentStatus.OPEN} />
            <StatCard title="Unter Beobachtung" count={monitoringIncidents} icon={Clock} colorClass="text-amber-600" bgClass="bg-amber-50" targetStatus={IncidentStatus.MONITORING} />
            <StatCard title="Gesamteinträge" count={incidents.length} icon={ShieldAlert} colorClass="text-blue-600" bgClass="bg-blue-50" />
            <StatCard title="Geklärte Fälle" count={incidents.filter(i => i.status === IncidentStatus.RESOLVED).length} icon={CheckCircle} colorClass="text-emerald-600" bgClass="bg-emerald-50" targetStatus={IncidentStatus.RESOLVED} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-800">Schnellzugriff</h3>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4 flex-1">
                <Link to="/incidents/new" className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors group">
                  <ShieldAlert className="w-10 h-10 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-blue-800 text-center text-sm">Neuen Vorfall melden</span>
                </Link>
                <Link to="/incidents" className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors group">
                  <Clock className="w-10 h-10 text-gray-600 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-gray-800 text-center text-sm">Protokolle einsehen</span>
                </Link>
              </div>
            </div>

            {/* Recent List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-800">Letzte Einträge</h3>
              </div>
              <div className="divide-y divide-gray-100 flex-1">
                {loading ? (
                  <div className="p-6 text-center text-gray-400 italic">Lädt...</div>
                ) : recentIncidents.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 italic text-sm">Keine Einträge vorhanden.</div>
                ) : (
                  recentIncidents.map(inc => (
                    <div key={inc.id} onClick={() => navigate(`/incidents/edit/${inc.id}`)} className="p-4 hover:bg-blue-50 flex justify-between items-center cursor-pointer transition-colors group">
                      <div>
                        <p className="font-medium text-gray-800 group-hover:text-blue-800 transition-colors">{inc.category}</p>
                        <p className="text-sm text-gray-500">{new Date(inc.date).toLocaleDateString()} • {inc.location}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${inc.status === IncidentStatus.OPEN ? 'bg-red-100 text-red-700' : 
                          inc.status === IncidentStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                          inc.status === IncidentStatus.MONITORING ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'}`}>
                        {inc.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};