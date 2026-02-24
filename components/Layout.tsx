import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShieldAlert, Users, Settings, MessageSquare, Lock, Maximize, Minimize, Menu, X, FileText, ChevronDown } from 'lucide-react';
import { fetchIncidents, fetchConversations, fetchMeetingMinutes, fetchStudents } from '../services/nextcloudService';

const SidebarNavItem = ({ link, isActive, isSidebarOpen, setIsSidebarOpen, location }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isActive) setIsExpanded(false);
  }, [isActive]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isExpanded) {
      setIsExpanded(true);
      setLoading(true);
      try {
        let fetchedItems: any[] = [];
        if (link.type === 'incidents') {
          const [incs, studs] = await Promise.all([fetchIncidents(), fetchStudents()]);
          fetchedItems = incs.map(i => {
            const s = studs.find(st => st.id === i.studentId);
            const name = s ? `${s.lastName}, ${s.firstName}` : 'Unbekannt';
            return { id: i.id, date: i.date, title: `${name} - ${i.category}`, to: `/incidents/edit/${i.id}` };
          });
        } else if (link.type === 'protocols') {
          const convs = await fetchConversations();
          fetchedItems = convs.map(c => ({
            id: c.id, date: c.date, title: c.studentName || c.subject || 'Gespräch', to: `/protocols/edit/${c.id}`
          }));
        } else if (link.type === 'meetings') {
          const meetings = await fetchMeetingMinutes();
          fetchedItems = meetings.map(m => {
            const dateStr = new Date(m.date).toLocaleDateString('de-DE');
            let titleParts = [];
            const occ = m.occasion || 'UP-Sitzung';
            if (occ === 'Sonstige') {
              if (m.occasionDetail) {
                titleParts.push(m.occasionDetail);
              } else {
                titleParts.push('Sitzung');
              }
            } else {
              titleParts.push(occ);
              if (['Fachkonferenz', 'Teamsitzung'].includes(occ) && m.occasionDetail) {
                titleParts.push(m.occasionDetail);
              }
            }
            titleParts.push(dateStr);
            return {
              id: m.id, date: m.date, title: titleParts.join(' '), to: `/meetings/edit/${m.id}`
            };
          });
        }
        
        fetchedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setItems(fetchedItems);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      setIsExpanded(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className={`flex items-center rounded-xl transition-all duration-200 ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
        {isActive && link.type && (
          <button 
            onClick={handleToggle} 
            className="p-3 pl-3 pr-2 hover:bg-white/20 rounded-l-xl transition-colors flex items-center justify-center"
            title="Letzte Protokolle anzeigen"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
        <Link 
          to={link.to} 
          onClick={() => setIsSidebarOpen(false)} 
          className={`flex items-center space-x-3 flex-1 py-3 ${isActive && link.type ? 'pr-4 pl-1' : 'px-4'}`}
        >
          <link.icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium truncate">{link.label}</span>
        </Link>
      </div>
      {isExpanded && isActive && (
        <div className="mt-2 ml-4 pl-4 border-l border-slate-700 space-y-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="text-slate-400 text-sm py-2">Lade...</div>
          ) : items.length === 0 ? (
            <div className="text-slate-400 text-sm py-2">Keine Einträge</div>
          ) : (
            items.map(item => {
              const isCurrentItem = location.pathname === item.to;
              return (
                <Link 
                  key={item.id} 
                  to={item.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`block py-2 px-3 text-sm rounded-lg transition-colors truncate ${isCurrentItem ? 'bg-slate-800 text-white font-medium' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                >
                  <div className="truncate">{item.title}</div>
                  <div className={`text-xs ${isCurrentItem ? 'text-blue-400' : 'text-slate-500'}`}>
                    {new Date(item.date).toLocaleDateString('de-DE')}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export const AppLayout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const links = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/incidents", icon: ShieldAlert, label: "Vorfallsprotokolle", type: 'incidents' },
    { to: "/protocols", icon: MessageSquare, label: "Gesprächsprotokolle", type: 'protocols' },
    { to: "/meetings", icon: FileText, label: "Sitzungsprotokolle", type: 'meetings' },
    { to: "/structure", icon: Users, label: "Verwaltung" },
  ];

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // Close sidebar on route change (for mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen mode: ${e.message} (${e.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const isLinkActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const isSettingsActive = location.pathname === '/settings';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-40 shadow-md print:hidden">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-1 rounded-md w-10 h-10 flex items-center justify-center">
             <img 
               src="https://victorymind.de/nextcloud/index.php/apps/files_sharing/publicpreview/d46AGa5jWRKGaXX?file=/&fileId=728&x=3024&y=1964&a=true&etag=ed17bd91eacca7d1bfcaa55efd52e5b2" 
               alt="CVO Logo" 
               className="h-8 object-contain" 
             />
          </div>
          <span className="font-bold text-blue-400">CVO-Doku</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-300 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm print:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-slate-900 text-white flex flex-col 
        transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:sticky md:top-0 md:h-screen
        print:hidden
      `}>
        <div className="p-6 border-b border-slate-800 flex flex-col items-center relative">
          {/* Close button for mobile inside sidebar */}
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="absolute top-4 right-4 md:hidden text-slate-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="bg-white p-2 rounded-lg mb-4 w-full flex justify-center shadow-lg shadow-blue-900/20">
             <img 
               src="https://victorymind.de/nextcloud/index.php/apps/files_sharing/publicpreview/d46AGa5jWRKGaXX?file=/&fileId=728&x=3024&y=1964&a=true&etag=ed17bd91eacca7d1bfcaa55efd52e5b2" 
               alt="CVO Logo" 
               className="h-16 object-contain" 
             />
          </div>
          <h1 className="text-xl font-bold text-blue-400 text-center leading-tight hidden md:block">
            CVO-Dokumentation
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {links.map((link) => {
            const isActive = isLinkActive(link.to);
            return (
              <SidebarNavItem 
                key={link.to}
                link={link}
                isActive={isActive}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                location={location}
              />
            );
          })}
        </nav>
        
        {/* Admin / Footer Area */}
        <button 
          onClick={() => { navigate('/settings'); setIsSidebarOpen(false); }}
          className={`w-full text-left p-6 border-t border-slate-800 transition-colors cursor-pointer group flex items-center space-x-3 focus:outline-none ${isSettingsActive ? 'bg-slate-800' : 'bg-slate-900/50 hover:bg-slate-800'}`}
        >
          <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${isSettingsActive ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 group-hover:text-slate-200'}`}>
            {isSettingsActive ? <Settings className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-400 group-hover:text-slate-200 truncate">Lehrkraft</p>
            <p className="text-xs truncate text-slate-500 group-hover:text-blue-400 flex items-center">
              Admin-Bereich <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </p>
          </div>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 relative overflow-x-hidden w-full">
        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-white text-gray-500 hover:text-blue-600 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-all z-10 print:hidden"
          title={isFullscreen ? "Vollbildmodus verlassen" : "Vollbildmodus"}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>

        <div className="max-w-7xl mx-auto mt-8 md:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
};