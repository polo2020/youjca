/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import {
  Terminal,
  Cpu,
  Database,
  User,
  Video,
  MessageSquare,
  ChevronRight,
  Github,
  Linkedin,
  Twitter,
  Globe,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  LogOut,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  Menu,
  X,
  TrendingUp,
  Users,
  PlayCircle,
  Eye,
  Heart,
  Calendar,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react';

// Firebase Imports
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  getDoc,
  setDoc,
  handleFirestoreError,
  OperationType
} from './firebase';

// --- Error Boundary ---

class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Algo salió mal</h1>
            <p className="text-white/60">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-emerald-500 text-black px-6 py-2 rounded-lg font-bold hover:bg-emerald-600"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Vimeo Logic ---

const extractVimeoId = (url: string) => {
  if (/^\d+$/.test(url)) return url;
  const match = url.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/)?(\d+)/);
  return match ? match[1] : url;
};

const formatDuration = (seconds: number) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getVimeoVideoInfo = async (videoId: string) => {
  try {
    const id = extractVimeoId(videoId);
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}`;
    const response = await fetch(oembedUrl);
    if (!response.ok) throw new Error(`Video no encontrado o privado`);
    const data = await response.json();
    return {
      success: true,
      video: {
        vimeoId: id,
        title: data.title || 'Video de Vimeo',
        description: data.description || '',
        thumbnail: data.thumbnail_url || `https://vumbnail.com/${id}.jpg`,
        duration: formatDuration(data.duration),
        category: 'General',
        author: data.author_name || 'Vimeo',
        authorAvatar: null,
        uploadDate: new Date().toISOString(),
        url: `https://vimeo.com/${id}`,
        embedUrl: `https://player.vimeo.com/video/${id}`,
        views: 0,
        likes: 0
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

// --- Statistics Hook ---

interface Stats {
  totalUsers: number;
  totalVideos: number;
  totalViews: number;
  totalComments: number;
  lastUpdated: Date;
}

const useStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalVideos: 0,
    totalViews: 0,
    totalComments: 0,
    lastUpdated: new Date()
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get real counts from collections (videos, comments are public)
        const videosSnapshot = await getDocs(collection(db, 'videos'));
        const commentsSnapshot = await getDocs(collection(db, 'comments'));

        let totalViews = 0;
        videosSnapshot.docs.forEach(doc => {
          const data = doc.data();
          totalViews += data.views || 0;
        });

        // Use allUsersList instead of users (more permissive rules)
        let totalUsers = 0;
        try {
          const allUsersSnapshot = await getDocs(collection(db, 'allUsersList'));
          totalUsers = allUsersSnapshot.size;
        } catch (userError) {
          console.warn('Cannot read allUsersList:', userError);
        }

        setStats({
          totalUsers,
          totalVideos: videosSnapshot.size,
          totalViews,
          totalComments: commentsSnapshot.size,
          lastUpdated: new Date()
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Real-time updates for public collections
    const unsubscribeVideos = onSnapshot(collection(db, 'videos'), () => fetchStats());
    const unsubscribeComments = onSnapshot(collection(db, 'comments'), () => fetchStats());
    const unsubscribeAllUsers = onSnapshot(collection(db, 'allUsersList'), () => fetchStats());

    return () => {
      unsubscribeVideos();
      unsubscribeComments();
      unsubscribeAllUsers();
    };
  }, []);

  return { stats, loading };
};

// --- Components ---

const StatsCard = ({ icon: Icon, label, value, color, loading, index }: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  loading: boolean;
  index: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          delay: index * 0.1,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, cardRef);

    return () => ctx.revert();
  }, [index]);

  return (
    <div ref={cardRef} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="text-black w-6 h-6" />
        </div>
        {loading ? (
          <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
        ) : (
          <TrendingUp className="w-5 h-5 text-emerald-500/50" />
        )}
      </div>
      <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">
        {loading ? '-' : value.toLocaleString()}
      </p>
    </div>
  );
};

const Navbar = ({ user, isAdmin, onLogin, onLogout, activeTab, setActiveTab }: {
  user: any,
  isAdmin: boolean,
  onLogin: () => void,
  onLogout: () => void,
  activeTab: string,
  setActiveTab: (tab: string) => void
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'videos', label: 'Videos' },
    { id: 'stats', label: 'Estadísticas' },
    { id: 'about', label: 'Sobre Mí' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin' }] : [])
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || activeTab !== 'inicio' || mobileMenuOpen ? 'bg-black/90 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <button
          onClick={() => handleTabClick('inicio')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Zap className="text-black w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">YouJCA <span className="text-emerald-500">TECH</span></span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleTabClick(link.id)}
              className={`transition-colors ${activeTab === link.id ? 'text-emerald-500' : 'text-white/70 hover:text-emerald-500'}`}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-white">{user.displayName}</p>
                  <p className="text-[10px] text-emerald-500 uppercase tracking-widest">{isAdmin ? 'Administrador' : 'Usuario'}</p>
                </div>
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-10 h-10 rounded-full border border-emerald-500/50" />
                <button onClick={onLogout} className="p-2 text-white/50 hover:text-red-500 transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="bg-emerald-500 hover:bg-emerald-600 text-black px-5 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Conectar
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-white hover:text-emerald-500 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 border-b border-white/10 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleTabClick(link.id)}
                  className={`text-left text-lg font-bold transition-colors ${activeTab === link.id ? 'text-emerald-500' : 'text-white/70 hover:text-emerald-500'}`}
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-6 border-t border-white/10">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-12 h-12 rounded-full border border-emerald-500/50" />
                      <div>
                        <p className="text-sm font-bold text-white">{user.displayName}</p>
                        <p className="text-[10px] text-emerald-500 uppercase tracking-widest">{isAdmin ? 'Administrador' : 'Usuario'}</p>
                      </div>
                    </div>
                    <button onClick={onLogout} className="p-3 bg-white/5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors">
                      <LogOut size={20} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onLogin}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    Conectar con Google
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const cpuRef = useRef<SVGSVGElement>(null);
  const databaseRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      // Timeline principal del Hero
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Badge de entrada
      tl.from('.hero-badge', {
        opacity: 0,
        y: 20,
        duration: 0.6
      })
      // Título con stagger
        .from('.hero-title', {
          opacity: 0,
          y: 50,
          duration: 0.8
        }, '-=0.4')
        .from('.hero-title-gradient', {
          opacity: 0,
          y: 30,
          duration: 0.6
        }, '-=0.5')
      // Descripción
        .from('.hero-description', {
          opacity: 0,
          y: 30,
          duration: 0.6
        }, '-=0.4')
      // Botones
        .from('.hero-buttons > *', {
          opacity: 0,
          y: 20,
          stagger: 0.15,
          duration: 0.5
        }, '-=0.3');

      // Animación parallax de iconos flotantes con ScrollTrigger
      if (cpuRef.current && databaseRef.current) {
        gsap.to(cpuRef.current, {
          y: 30,
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          }
        });

        gsap.to(databaseRef.current, {
          y: -30,
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          }
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="home" ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div>
          <div className="hero-badge inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-widest mb-6">
            <Terminal className="w-3 h-3" />
            Tecnología • Linux • IA
          </div>
          <h1 className="hero-title text-6xl md:text-8xl font-black text-white tracking-tighter leading-none mb-8">
            <span className="hero-title-gradient text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 inline-block">
              IMPULSANDO EL <br />
              FUTURO TECH
            </span>
          </h1>
          <p className="hero-description text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tu plataforma especializada en tecnología, Linux e Inteligencia Artificial.
            Encuentra tutoriales, trucos, reviews y las últimas novedades del mundo tech.
          </p>

          <div className="hero-buttons flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setActiveTab('videos')}
              className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-2 group"
            >
              Explorar Tutoriales
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              Ver Estadísticas
            </button>
          </div>
        </div>
      </div>

      <div
        ref={cpuRef}
        className="absolute top-1/3 left-10 hidden lg:block opacity-20"
      >
        <Cpu size={80} className="text-emerald-500" />
      </div>
      <div
        ref={databaseRef}
        className="absolute bottom-1/3 right-10 hidden lg:block opacity-20"
      >
        <Database size={80} className="text-blue-500" />
      </div>
    </section>
  );
};

interface VideoCardProps {
  video: any;
  onDelete: (id: string) => void | Promise<void>;
  isAdmin: boolean;
}

const VideoCard: React.FC<VideoCardProps & { index: number }> = ({ video, onDelete, isAdmin, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current,
        { opacity: 0, scale: 0.9, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          delay: index * 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 90%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, cardRef);

    return () => ctx.revert();
  }, [index]);

  return (
    <div ref={cardRef} className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden group hover:border-emerald-500/30 transition-all">
      <div className="relative aspect-video overflow-hidden">
        <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <a href={video.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-black">
            <ExternalLink size={20} />
          </a>
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-[10px] font-bold rounded">
          {video.duration}
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h4 className="text-white font-bold text-sm line-clamp-2">{video.title}</h4>
          {isAdmin && (
            <button onClick={() => onDelete(video.id)} className="p-1.5 text-white/20 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest font-bold">
          <span>{video.category}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye size={10} /> {video.views || 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={10} /> {video.likes || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface Comment {
  id: string;
  userId: string;
  text: string;
  userName: string;
  userAvatar: string;
  createdAt: any;
  likes: number;
}

const CommentsSection = ({ videoId, user }: { videoId: string; user: any }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('videoId', '==', videoId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(commentsList);
    });

    return () => unsubscribe();
  }, [videoId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'comments'), {
        videoId,
        userId: user.uid,
        text: newComment.trim(),
        userName: user.displayName,
        userAvatar: user.photoURL,
        createdAt: serverTimestamp(),
        likes: 0
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <h4 className="text-white font-bold mb-4 flex items-center gap-2">
        <MessageSquare size={18} className="text-emerald-500" />
        Comentarios ({comments.length})
      </h4>

      {user ? (
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all resize-none"
            rows={3}
          />
          <button
            onClick={handleAddComment}
            disabled={loading || !newComment.trim()}
            className="mt-2 bg-emerald-500 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Publicando...' : 'Publicar comentario'}
          </button>
        </div>
      ) : (
        <p className="text-white/40 text-sm mb-4">Inicia sesión para comentar</p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <img src={comment.userAvatar} className="w-8 h-8 rounded-full" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-bold text-sm">{comment.userName}</span>
                <span className="text-white/30 text-xs">
                  {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : 'Reciente'}
                </span>
              </div>
              <p className="text-white/70 text-sm">{comment.text}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-white/40 text-sm text-center py-4">Sé el primero en comentar</p>
        )}
      </div>
    </div>
  );
};

const VideosSection = ({ videos, loading, isAdmin, onDelete }: {
  videos: any[];
  loading: boolean;
  isAdmin: boolean;
  onDelete: (id: string) => void | Promise<void>;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const categories = ['Todos', 'Linux', 'IA', 'Tutorial', 'Review', 'General'];

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Animación del header
      gsap.fromTo('.videos-header',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%'
          }
        }
      );

      gsap.fromTo('.videos-subtitle',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%'
          }
        }
      );

      // Animación de filtros
      gsap.fromTo('.videos-filters > *',
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          stagger: 0.05,
          duration: 0.4,
          delay: 0.4,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%'
          }
        }
      );

      // Animación del search
      gsap.fromTo('.videos-search',
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          delay: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%'
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="videos" ref={sectionRef} className="py-24 bg-black relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="videos-header flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Últimos <span className="text-emerald-500">Tutoriales</span></h2>
            <p className="videos-subtitle text-white/50">Aprende sobre Linux, IA y tecnología con nosotros.</p>
          </div>
          <div className="videos-filters flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-black border-emerald-500'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-emerald-500 hover:text-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="videos-search relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar videos..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredVideos.map((video, index) => (
              <div key={video.id}>
                <VideoCard video={video} isAdmin={isAdmin} onDelete={onDelete} index={index} />
                <button
                  onClick={() => setSelectedVideo(video)}
                  className="w-full mt-2 text-emerald-500 text-sm font-bold hover:underline"
                >
                  Ver detalles
                </button>
              </div>
            ))}
            {filteredVideos.length === 0 && (
              <div className="col-span-full py-20 text-center bg-zinc-900/30 border border-dashed border-white/10 rounded-3xl">
                <Video className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 font-medium">No hay videos disponibles.</p>
              </div>
            )}
          </div>
        )}

        {/* Video Detail Modal */}
        <AnimatePresence>
          {selectedVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedVideo(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-white">{selectedVideo.title}</h3>
                    <button
                      onClick={() => setSelectedVideo(null)}
                      className="text-white/50 hover:text-white"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="aspect-video rounded-xl overflow-hidden mb-4">
                    <iframe
                      src={selectedVideo.embedUrl}
                      className="w-full h-full"
                      allowFullScreen
                      allow="autoplay; fullscreen; picture-in-picture"
                    />
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm text-white/60">
                    <span className="flex items-center gap-1">
                      <Eye size={16} /> {selectedVideo.views || 0} vistas
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={16} /> {selectedVideo.likes || 0} likes
                    </span>
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-500 rounded text-xs font-bold">
                      {selectedVideo.category}
                    </span>
                  </div>

                  <p className="text-white/70 mb-6">{selectedVideo.description}</p>

                  <CommentsSection videoId={selectedVideo.id} user={auth.currentUser} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

const StatsSection = () => {
  const { stats, loading } = useStats();
  const sectionRef = useRef<HTMLDivElement>(null);

  const statCards = [
    { icon: Users, label: 'Usuarios Totales', value: stats.totalUsers, color: 'bg-emerald-500' },
    { icon: Video, label: 'Videos Publicados', value: stats.totalVideos, color: 'bg-blue-500' },
    { icon: Eye, label: 'Vistas Totales', value: stats.totalViews, color: 'bg-purple-500' },
    { icon: MessageSquare, label: 'Comentarios', value: stats.totalComments, color: 'bg-orange-500' }
  ];

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Animación del título y descripción
      gsap.fromTo('.stats-header',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%'
          }
        }
      );

      gsap.fromTo('.stats-subtitle',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%'
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="stats" ref={sectionRef} className="py-24 bg-zinc-950 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="stats-header flex items-center gap-3 mb-4">
          <TrendingUp className="text-emerald-500 w-8 h-8" />
          <h2 className="text-3xl md:text-4xl font-bold text-white">Estadísticas <span className="text-emerald-500">en Tiempo Real</span></h2>
        </div>
        <p className="stats-subtitle text-white/50 mb-12 max-w-2xl">
          Datos actualizados automáticamente desde Firebase Firestore. Las estadísticas reflejan el estado real de la plataforma.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statCards.map((stat, index) => (
            <StatsCard
              key={index}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              color={stat.color}
              loading={loading}
              index={index}
            />
          ))}
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Última actualización: {stats.lastUpdated.toLocaleString('es-ES')}</span>
        </div>

        {/* Info Card */}
        <div className="mt-12 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8">
          <div className="flex items-start gap-4">
            <ShieldCheck className="text-emerald-500 w-12 h-12 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Seguridad y Transparencia</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Todas las estadísticas se obtienen directamente de Firebase Firestore en tiempo real.
                Los datos son verificados y actualizados automáticamente cada vez que hay cambios en la plataforma.
                Las reglas de seguridad de Firebase garantizan la integridad de los datos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const AdminPanel = ({ isAdmin, user }: { isAdmin: boolean; user: any }) => {
  const [vimeoUrl, setVimeoUrl] = useState('');
  const [category, setCategory] = useState('Linux');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      // Load stats
      const loadStats = async () => {
        const statsDoc = await getDoc(doc(db, 'stats', 'counts'));
        if (statsDoc.exists()) {
          setStats(statsDoc.data());
        }

        // Load users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };

      loadStats();
    }
  }, [isAdmin]);

  const handleImport = async () => {
    if (!vimeoUrl) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await getVimeoVideoInfo(vimeoUrl);
      if (result.success && result.video) {
        const path = 'videos';
        try {
          await addDoc(collection(db, path), {
            ...result.video,
            category,
            createdAt: serverTimestamp(),
            importedAt: serverTimestamp()
          });
          setMessage({ text: 'Video importado con éxito', type: 'success' });
          setVimeoUrl('');
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      } else {
        setMessage({ text: result.error || 'Error al importar', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncStats = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      await setDoc(doc(db, 'stats', 'counts'), {
        totalUsers: usersSnapshot.size,
        lastSync: serverTimestamp()
      }, { merge: true });
      setMessage({ text: 'Estadísticas sincronizadas', type: 'success' });
      setStats({ totalUsers: usersSnapshot.size });
    } catch (error) {
      setMessage({ text: 'Error al sincronizar', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <section id="admin" className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-12">
          <LayoutDashboard className="text-emerald-500 w-8 h-8" />
          <h2 className="text-3xl font-bold text-white">Panel de <span className="text-emerald-500">Administración</span></h2>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
            <p className="text-white/40 text-xs uppercase mb-1">Usuarios</p>
            <p className="text-2xl font-bold text-white">{stats?.totalUsers || users.length}</p>
          </div>
          <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
            <p className="text-white/40 text-xs uppercase mb-1">Videos</p>
            <p className="text-2xl font-bold text-white">{users.length > 0 ? '—' : '-'}</p>
          </div>
          <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
            <p className="text-white/40 text-xs uppercase mb-1">Tu Rol</p>
            <p className="text-lg font-bold text-emerald-500">Admin</p>
          </div>
          <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
            <p className="text-white/40 text-xs uppercase mb-1">Email</p>
            <p className="text-xs font-bold text-white truncate">{user?.email}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Import Video */}
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="text-emerald-500" />
              Importar Video de Vimeo
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">URL de Vimeo</label>
                <input
                  type="text"
                  value={vimeoUrl}
                  onChange={(e) => setVimeoUrl(e.target.value)}
                  placeholder="https://vimeo.com/..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all appearance-none"
                >
                  <option value="Linux">Linux</option>
                  <option value="IA">Inteligencia Artificial</option>
                  <option value="Tutorial">Tutorial</option>
                  <option value="Review">Review</option>
                  <option value="General">General</option>
                </select>
              </div>
              <button
                onClick={handleImport}
                disabled={loading || !vimeoUrl}
                className="w-full py-4 bg-emerald-500 text-black rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                Importar Ahora
              </button>
              {message && (
                <p className={`text-sm font-medium ${message.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {message.text}
                </p>
              )}
            </div>
          </div>

          {/* Sync Stats */}
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <RefreshCw className="text-emerald-500" />
              Sincronizar Estadísticas
            </h3>
            <p className="text-white/60 text-sm mb-6">
              Las estadísticas se actualizan automáticamente, pero puedes forzar una sincronización manual si es necesario.
            </p>
            <button
              onClick={handleSyncStats}
              disabled={loading}
              className="w-full py-4 bg-blue-500 text-black rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Sincronizar Ahora
            </button>
            {stats && (
              <div className="mt-4 p-4 bg-white/5 rounded-xl">
                <p className="text-white/40 text-xs uppercase mb-2">Última sincronización</p>
                <p className="text-white font-bold">
                  {stats.lastSync?.toDate ? stats.lastSync.toDate().toLocaleString() : 'No sincronizado'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Security Info */}
        <div className="mt-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8">
          <ShieldCheck className="text-emerald-500 w-12 h-12 mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">Seguridad de Datos</h3>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Las reglas de seguridad de Firestore están activas. Solo tú como administrador puedes importar o eliminar videos.
            Los usuarios normales solo tienen permisos de lectura y comentarios.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-emerald-500/70 text-xs font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              UID-Based Admin Verification
            </div>
            <div className="flex items-center gap-3 text-emerald-500/70 text-xs font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Email-Based Super Admin (jcristojean2020@gmail.com)
            </div>
            <div className="flex items-center gap-3 text-emerald-500/70 text-xs font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Real-time Firestore Security Rules
            </div>
          </div>
        </div>

        {/* Users List */}
        {users.length > 0 && (
          <div className="mt-8 bg-zinc-900 border border-white/5 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Users className="text-emerald-500" />
              Usuarios Registrados ({users.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <img src={u.avatar || u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName || u.email}`} className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm">{u.displayName || u.email}</p>
                    <p className="text-white/40 text-xs">{u.email}</p>
                  </div>
                  <span className="text-white/30 text-xs">
                    {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'Reciente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// --- About Section ---

const AboutSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Timeline para el contenido de texto
      gsap.fromTo('.about-content',
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%'
          }
        }
      );

      // Animación para la imagen
      gsap.fromTo('.about-image',
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          delay: 0.2,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%'
          }
        }
      );

      // Animación para redes sociales
      gsap.fromTo('.about-social > *',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.5,
          delay: 0.4,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%'
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="py-24 bg-zinc-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="about-content">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl" />
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
                Jean Carlos <span className="text-emerald-500">Acevedo</span>
              </h2>
            </div>
            <div className="space-y-6 text-white/70 leading-relaxed">
              <p className="text-lg">
                📍 Venezuela • Entusiasta de la Tecnología
              </p>
              <p>
                👋 Hola, soy Jean Carlos Acevedo, creador de <span className="text-white font-semibold">YouJCA Tech</span>.
                No soy programador ni me considero uno. Solo soy un entusiasta enamorado de la tecnología, de Linux y de la Inteligencia Artificial.
              </p>
              <p>
                🚀 Uso estas herramientas todos los días para aprender y crecer. Esta plataforma es mi forma de compartir un poco de todo lo que he aprendido en el camino.
              </p>
              <div className="p-6 bg-white/5 border-l-4 border-emerald-500 rounded-r-xl italic text-white/80">
                "La tecnología es para todos, no solo para expertos" 💚
              </div>
            </div>

            <div className="about-social flex gap-4 mt-10">
              <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-emerald-500 hover:text-black transition-all">
                <Github size={20} />
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-emerald-500 hover:text-black transition-all">
                <Linkedin size={20} />
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-emerald-500 hover:text-black transition-all">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          <div className="about-image relative">
            <div className="aspect-square rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 relative">
              <img
                src="/youjca/administrador.jpg"
                alt="Jean Carlos Acevedo"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Activo en la Comunidad</span>
                </div>
                <p className="text-white font-bold text-xl">Compartiendo conocimiento desde Venezuela para el mundo.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Main App ---

function MainApp() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inicio');
  const { stats } = useStats();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const path = `admins/${currentUser.uid}`;
        try {
          const adminDoc = await getDoc(doc(db, path));
          setIsAdmin(adminDoc.exists() || currentUser.email === 'jcristojean2020@gmail.com');
        } catch (err) {
          setIsAdmin(currentUser.email === 'jcristojean2020@gmail.com');
        }
      } else {
        setIsAdmin(false);
      }
    });

    const vPath = 'videos';
    const q = query(collection(db, vPath), orderBy('createdAt', 'desc'));
    const unsubscribeVideos = onSnapshot(q, (snapshot) => {
      const vList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVideos(vList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, vPath);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeVideos();
    };
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Registrar usuario en Firestore si es nuevo
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Crear documento de usuario
          const userData = {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
            email: user.email,
            avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=00ff88&color=000`,
            createdAt: serverTimestamp(),
            role: 'user'
          };
          
          // Guardar en users
          await setDoc(userRef, userData);
          
          // Guardar en allUsersList (para administración)
          await setDoc(doc(db, 'allUsersList', user.uid), userData);
          
          console.log('Usuario registrado:', userData);
        }
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este video?')) return;
    const path = `videos/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500 selection:text-black">
      <Navbar
        user={user}
        isAdmin={isAdmin}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="pt-20">
        <AnimatePresence mode="wait">
          {activeTab === 'inicio' && (
            <motion.div
              key="inicio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Hero setActiveTab={setActiveTab} />
            </motion.div>
          )}

          {activeTab === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <VideosSection
                videos={videos}
                loading={loading}
                isAdmin={isAdmin}
                onDelete={handleDeleteVideo}
              />
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StatsSection />
            </motion.div>
          )}

          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AboutSection />
            </motion.div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminPanel isAdmin={isAdmin} user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-12 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
              <Zap className="text-black w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tighter text-white">YouJCA <span className="text-emerald-500">TECH</span></span>
          </div>

          <p className="text-white/40 text-sm">
            © 2026 YouJCA Tech. Diseñado con ❤️ para la comunidad.
          </p>

          <div className="flex items-center gap-6 text-white/40">
            <a href="#" className="hover:text-white transition-colors"><Github size={18} /></a>
            <a href="#" className="hover:text-white transition-colors"><Twitter size={18} /></a>
            <a href="#" className="hover:text-white transition-colors"><Linkedin size={18} /></a>
          </div>
        </div>
      </footer>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
