import { 
  Home,
  LayoutDashboard,
  Users, 
  Utensils, 
  Pill, 
  FileText, 
  FolderOpen,
  Image, 
  Brain, 
  Bot,
  Baby,
  Palette,
  Calendar,
  Heart,
  Stethoscope,
  TestTube,
  Bed,
  Hotel,
  LogIn,
  Sparkles,
  Star,
  ClipboardList,
  Building,
  DollarSign,
  Settings,
  HelpCircle,
  UserCog,
  Clock,
  type LucideIcon
} from 'lucide-react';

export type OrganizationType = 'camin' | 'gradinita' | 'spital' | 'hotel';

export interface SidebarSubItem {
  label: string;
  href: string;
  badge?: 'Nou' | 'Soon';
}

export interface SidebarItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: 'Nou' | 'Soon';
  color: string;
  bgColor: string;
  hoverColor: string;
  subItems?: SidebarSubItem[];
}

export const getSidebarConfig = (type: OrganizationType): SidebarItem[] => {
  // Itemuri comune pentru toate tipurile
  const commonItems: SidebarItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      href: '/dashboard',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100'
    }
  ];

  const settingsItems: SidebarItem[] = [
    {
      icon: Settings,
      label: 'Setări',
      href: '/settings',
      badge: 'Soon',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      hoverColor: 'hover:bg-gray-100',
      subItems: [
        { label: 'Profil organizație', href: '/settings/profile', badge: 'Soon' },
        { label: 'Utilizatori/Personal', href: '/settings/users', badge: 'Soon' },
        { label: 'Preferințe', href: '/settings/preferences', badge: 'Soon' }
      ]
    },
    {
      icon: HelpCircle,
      label: 'Suport',
      href: '/support',
      badge: 'Soon',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      subItems: [
        { label: 'Help & Support', href: '/support/help', badge: 'Soon' },
        { label: 'Documentație', href: '/support/docs', badge: 'Soon' }
      ]
    }
  ];

  const aiItems: SidebarItem[] = [
    {
      icon: Brain,
      label: 'Analiză AI',
      href: '/ai-analysis',
      badge: 'Soon',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100'
    },
    {
      icon: Bot,
      label: 'Asistent AI',
      href: '/ai-assistant',
      badge: 'Soon',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      hoverColor: 'hover:bg-pink-100'
    }
  ];

  switch (type) {
    case 'camin':
      return [
        ...commonItems,
        {
          icon: Building,
          label: 'Căminele Mele',
          href: '/camine',
          badge: 'Soon',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          hoverColor: 'hover:bg-purple-100',
          subItems: [
            { label: 'Listă cămine', href: '/camine', badge: 'Soon' },
            { label: 'Adaugă cămin', href: '/camine/add' }
          ]
        },
        {
          icon: Users,
          label: 'Toți Rezidenții',
          href: '/residents',
          badge: 'Soon',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          hoverColor: 'hover:bg-green-100',
          subItems: [
            { label: 'Vizualizare centralizată', href: '/residents', badge: 'Soon' },
            { label: 'Filtrare & Căutare', href: '/residents/search', badge: 'Soon' },
            { label: 'Export date', href: '/residents/export', badge: 'Soon' }
          ]
        },
        {
          icon: Calendar,
          label: 'Calendar',
          href: '/calendar',
          badge: 'Soon',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          hoverColor: 'hover:bg-blue-100',
          subItems: [
            { label: 'Vizite medicale', href: '/calendar/medical', badge: 'Soon' },
            { label: 'Activități planificate', href: '/calendar/activities', badge: 'Soon' },
            { label: 'Zile de naștere', href: '/calendar/birthdays', badge: 'Soon' }
          ]
        },
        {
          icon: DollarSign,
          label: 'Financiar',
          href: '/financiar',
          badge: 'Soon',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          hoverColor: 'hover:bg-green-100',
          subItems: [
            { label: 'Plăți rezidenți', href: '/financiar/payments', badge: 'Soon' },
            { label: 'Facturi', href: '/financiar/invoices', badge: 'Soon' },
            { label: 'Rapoarte financiare', href: '/financiar/reports', badge: 'Soon' }
          ]
        },
        {
          icon: UserCog,
          label: 'Angajați',
          href: '/employees',
          badge: 'Nou',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          hoverColor: 'hover:bg-indigo-100',
          subItems: [
            { label: 'Listă angajați', href: '/employees', badge: 'Nou' },
            { label: 'Adaugă angajat', href: '/employees/add', badge: 'Nou' },
            { label: 'QR Code Pontaj', href: '/qr-code', badge: 'Nou' },
            { label: 'Pontaje', href: '/pontaje', badge: 'Soon' }
          ]
        },
        {
          icon: Utensils,
          label: 'Meniu AI',
          href: '/menu-ai',
          badge: 'Nou',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          hoverColor: 'hover:bg-orange-100'
        },
        {
          icon: Pill,
          label: 'Medicamente',
          href: '/medications',
          badge: 'Soon',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          hoverColor: 'hover:bg-red-100'
        },
        {
          icon: FileText,
          label: 'Rapoarte',
          href: '/rapoarte',
          badge: 'Nou',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          hoverColor: 'hover:bg-blue-100'
        },
        {
          icon: FolderOpen,
          label: 'Documente',
          href: '/documents',
          badge: 'Soon',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          hoverColor: 'hover:bg-indigo-100'
        },
        {
          icon: Image,
          label: 'Galerie Foto',
          href: '/gallery',
          badge: 'Soon',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          hoverColor: 'hover:bg-purple-100'
        },
        ...aiItems,
        ...settingsItems
      ];

    case 'gradinita':
      return [
        ...commonItems,
        {
          icon: Baby,
          label: 'Copii',
          href: '/children',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          hoverColor: 'hover:bg-blue-100'
        },
        {
          icon: Palette,
          label: 'Activități',
          href: '/activities',
          color: 'text-pink-600',
          bgColor: 'bg-pink-50',
          hoverColor: 'hover:bg-pink-100'
        },
        {
          icon: Utensils,
          label: 'Meniu AI',
          href: '/menu-ai',
          badge: 'Nou',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          hoverColor: 'hover:bg-orange-100'
        },
        {
          icon: Image,
          label: 'Galerie Foto',
          href: '/gallery',
          badge: 'Soon',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          hoverColor: 'hover:bg-purple-100'
        },
        {
          icon: Users,
          label: 'Părinți',
          href: '/parents',
          badge: 'Soon',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          hoverColor: 'hover:bg-green-100'
        },
        {
          icon: Calendar,
          label: 'Prezență',
          href: '/attendance',
          badge: 'Soon',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          hoverColor: 'hover:bg-yellow-100'
        },
        {
          icon: FileText,
          label: 'Rapoarte AI',
          href: '/reports-ai',
          badge: 'Soon',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          hoverColor: 'hover:bg-indigo-100'
        },
        ...aiItems
      ];

    case 'spital':
      return [
        ...commonItems,
        {
          icon: Users,
          label: 'Pacienți',
          href: '/patients',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          hoverColor: 'hover:bg-blue-100'
        },
        {
          icon: Stethoscope,
          label: 'Tratamente',
          href: '/treatments',
          badge: 'Soon',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          hoverColor: 'hover:bg-red-100'
        },
        {
          icon: TestTube,
          label: 'Analize',
          href: '/tests',
          badge: 'Soon',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          hoverColor: 'hover:bg-green-100'
        },
        {
          icon: Calendar,
          label: 'Programări',
          href: '/appointments',
          badge: 'Soon',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          hoverColor: 'hover:bg-purple-100'
        },
        {
          icon: Heart,
          label: 'Diagnostic AI',
          href: '/ai-diagnosis',
          badge: 'Nou',
          color: 'text-pink-600',
          bgColor: 'bg-pink-50',
          hoverColor: 'hover:bg-pink-100'
        },
        {
          icon: FileText,
          label: 'Rețete',
          href: '/prescriptions',
          badge: 'Soon',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          hoverColor: 'hover:bg-indigo-100'
        },
        ...aiItems
      ];

    case 'hotel':
      return [
        ...commonItems,
        {
          icon: Calendar,
          label: 'Rezervări',
          href: '/reservations',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          hoverColor: 'hover:bg-blue-100'
        },
        {
          icon: Bed,
          label: 'Camere',
          href: '/rooms',
          badge: 'Soon',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          hoverColor: 'hover:bg-green-100'
        },
        {
          icon: LogIn,
          label: 'Check-in/out',
          href: '/checkin',
          badge: 'Soon',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          hoverColor: 'hover:bg-orange-100'
        },
        {
          icon: Sparkles,
          label: 'Servicii',
          href: '/services',
          badge: 'Soon',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          hoverColor: 'hover:bg-yellow-100'
        },
        {
          icon: Star,
          label: 'Recenzii',
          href: '/reviews',
          badge: 'Soon',
          color: 'text-pink-600',
          bgColor: 'bg-pink-50',
          hoverColor: 'hover:bg-pink-100'
        },
        {
          icon: Brain,
          label: 'Recomandări AI',
          href: '/ai-recommendations',
          badge: 'Nou',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          hoverColor: 'hover:bg-purple-100'
        },
        ...aiItems
      ];

    default:
      return commonItems;
  }
};

// Helper pentru a obține label-ul tipului de organizație
export const getOrganizationTypeLabel = (type: OrganizationType): string => {
  switch (type) {
    case 'camin':
      return 'Cămin Bătrâni';
    case 'gradinita':
      return 'Grădiniță';
    case 'spital':
      return 'Spital / Clinică';
    case 'hotel':
      return 'Hotel / Pensiune';
    default:
      return 'Organizație';
  }
};
