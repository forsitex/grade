'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  ArrowLeft,
  MessageCircle,
  Loader2,
  Mail,
  MailOpen,
  Clock,
  User,
  Baby,
  Send
} from 'lucide-react';
import Link from 'next/link';
import BrandHeader from '@/components/BrandHeader';

interface Message {
  id: string;
  from: string;
  fromName: string;
  fromRole: 'educatoare' | 'parinte';
  to: string;
  toName: string;
  toRole: 'educatoare' | 'parinte';
  subject: string;
  body: string;
  copilCnp: string;
  copilNume: string;
  grupaId: string;
  read: boolean;
  createdAt: any;
  threadId: string;
  replyTo: string | null;
  threadCount: number;
}

export default function MesajeParintePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'toate' | 'necitite'>('toate');
  const [organizationId, setOrganizationId] = useState('');
  const [locationId, setLocationId] = useState('');

  useEffect(() => {
    incarcaMesaje();
  }, []);

  const incarcaMesaje = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Obține organizationId și locationId
      const parinteRef = doc(db, 'parinti', user.uid);
      const parinteSnap = await getDoc(parinteRef);

      if (!parinteSnap.exists()) {
        router.push('/login');
        return;
      }

      const parinteData = parinteSnap.data();
      setOrganizationId(parinteData.organizationId);
      setLocationId(parinteData.locationId);

      // Încarcă mesajele
      const messagesRef = collection(
        db,
        'organizations',
        parinteData.organizationId,
        'locations',
        parinteData.locationId,
        'messages'
      );

      const messagesSnap = await getDocs(messagesRef);
      
      const mesaje = messagesSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Message))
        .filter(msg => msg.to === user.uid)
        .sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

      setMessages(mesaje);
    } catch (error) {
      console.error('Eroare încărcare mesaje:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcheazaCaCitit = async (messageId: string) => {
    try {
      if (!organizationId || !locationId) return;

      const messageRef = doc(
        db,
        'organizations',
        organizationId,
        'locations',
        locationId,
        'messages',
        messageId
      );

      await updateDoc(messageRef, { read: true });

      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      ));
    } catch (error) {
      console.error('Eroare marcare mesaj citit:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Azi, ${date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Ieri, ${date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days < 7) {
      return `${days} zile, ${date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  };

  const filteredMessages = filter === 'necitite' 
    ? messages.filter(msg => !msg.read)
    : messages;

  const unreadCount = messages.filter(msg => !msg.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Se încarcă mesajele...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <BrandHeader logoSize="xl" showTitle={false} />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Breadcrumb */}
          <Link
            href="/dashboard-parinte"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi la Dashboard
          </Link>

          {/* Header Mesaje */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-6 text-white">
            <div className="flex items-center gap-4">
              <MessageCircle className="w-12 h-12" />
              <div>
                <h1 className="text-3xl font-bold mb-2">Mesaje</h1>
                <p className="text-white/90">
                  {unreadCount > 0 ? `${unreadCount} mesaje necitite` : 'Toate mesajele sunt citite'}
                </p>
              </div>
            </div>
          </div>

          {/* Acțiuni */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard-parinte/mesaje/nou"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              <Send className="w-5 h-5" />
              Mesaj Nou
            </Link>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter('toate')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'toate'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Toate ({messages.length})
              </button>
              <button
                onClick={() => setFilter('necitite')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'necitite'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Necitite ({unreadCount})
              </button>
            </div>
          </div>

          {/* Lista Mesaje */}
          {filteredMessages.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {filter === 'necitite' ? 'Nu ai mesaje necitite' : 'Nu ai mesaje'}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'necitite' 
                  ? 'Toate mesajele au fost citite' 
                  : 'Când vei primi mesaje, le vei vedea aici'}
              </p>
              <Link
                href="/dashboard-parinte/mesaje/nou"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                <Send className="w-5 h-5" />
                Trimite primul mesaj
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((message) => (
                <Link
                  key={message.id}
                  href={`/dashboard-parinte/mesaje/${message.id}`}
                  onClick={() => !message.read && marcheazaCaCitit(message.id)}
                  className={`block bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition border-l-4 ${
                    message.read 
                      ? 'border-gray-300' 
                      : 'border-blue-500 bg-blue-50/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.read ? 'bg-gray-200' : 'bg-blue-100'
                    }`}>
                      {message.read ? (
                        <MailOpen className={`w-6 h-6 ${message.read ? 'text-gray-600' : 'text-blue-600'}`} />
                      ) : (
                        <Mail className="w-6 h-6 text-blue-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className={`font-semibold ${message.read ? 'text-gray-900' : 'text-blue-900'}`}>
                            {message.fromName}
                          </span>
                          <span className="text-sm text-gray-500">({message.fromRole})</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {formatDate(message.createdAt)}
                        </div>
                      </div>

                      <h3 className={`text-lg mb-2 ${message.read ? 'font-medium text-gray-900' : 'font-bold text-gray-900'}`}>
                        {message.subject}
                      </h3>

                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {message.body}
                      </p>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Baby className="w-4 h-4" />
                        <span>Despre: {message.copilNume}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
