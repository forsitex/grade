import Image from 'next/image';

interface BrandHeaderProps {
  title?: string;
  logoSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showTitle?: boolean;
}

export default function BrandHeader({ title = 'Platforma Grădinițe', logoSize = 'md', showTitle = true }: BrandHeaderProps) {
  const logoSizes = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 120, height: 120 },
    full: { width: 400, height: 200 },
  };

  const size = logoSizes[logoSize];

  return (
    <div className={`flex items-center ${showTitle ? 'justify-center gap-3' : 'justify-center w-full'}`}>
      <div className={`relative ${logoSize === 'full' ? 'w-full' : 'flex-shrink-0'}`}>
        <Image
          src="/logo.png"
          alt="Gradinita.App Logo"
          width={size.width}
          height={size.height}
          priority
          className={`object-contain ${logoSize === 'full' ? 'w-full h-auto' : ''}`}
        />
      </div>
      {showTitle && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
    </div>
  );
}
