/**
 * Testes unitários para componente OptimizedImage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OptimizedImage, OptimizedAvatar } from '@/components/ui/OptimizedImage';

// Mock do Intersection Observer
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

// Mock do cn utility
vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve renderizar imagem com src fornecido', () => {
    render(
      <OptimizedImage 
        src="https://example.com/image.jpg" 
        alt="Imagem de teste"
        lazy={false}
      />
    );
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(img).toHaveAttribute('alt', 'Imagem de teste');
  });

  it('deve mostrar placeholder quando não há src', () => {
    render(
      <OptimizedImage 
        alt="Imagem de teste"
        placeholder={<div>Placeholder customizado</div>}
      />
    );
    
    expect(screen.getByText('Placeholder customizado')).toBeInTheDocument();
  });

  it('deve mostrar placeholder padrão quando não há src e placeholder', () => {
    render(<OptimizedImage alt="Imagem de teste" />);
    
    expect(screen.getByText('Imagem não disponível')).toBeInTheDocument();
  });

  it('deve implementar lazy loading por padrão', () => {
    const mockObserve = vi.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: mockObserve,
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    });

    render(
      <OptimizedImage 
        src="https://example.com/image.jpg" 
        alt="Imagem de teste"
      />
    );
    
    expect(mockObserve).toHaveBeenCalled();
  });

  it('deve não usar lazy loading quando lazy=false', () => {
    const mockObserve = vi.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: mockObserve,
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    });

    render(
      <OptimizedImage 
        src="https://example.com/image.jpg" 
        alt="Imagem de teste"
        lazy={false}
      />
    );
    
    expect(mockObserve).not.toHaveBeenCalled();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('deve otimizar URL do Supabase com parâmetros de qualidade', () => {
    render(
      <OptimizedImage 
        src="https://supabase.co/storage/image.jpg" 
        alt="Imagem de teste"
        lazy={false}
        quality={90}
      />
    );
    
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toContain('quality=90');
    expect(img.getAttribute('src')).toContain('format=webp');
  });

  it('deve chamar onLoad quando imagem carregar', async () => {
    const onLoad = vi.fn();
    
    render(
      <OptimizedImage 
        src="https://example.com/image.jpg" 
        alt="Imagem de teste"
        lazy={false}
        onLoad={onLoad}
      />
    );
    
    const img = screen.getByRole('img');
    fireEvent.load(img);
    
    expect(onLoad).toHaveBeenCalled();
  });

  it('deve chamar onError quando imagem falhar', async () => {
    const onError = vi.fn();
    
    render(
      <OptimizedImage 
        src="https://example.com/invalid-image.jpg" 
        alt="Imagem de teste"
        lazy={false}
        onError={onError}
      />
    );
    
    const img = screen.getByRole('img');
    fireEvent.error(img);
    
    expect(onError).toHaveBeenCalled();
  });

  it('deve tentar fallback quando imagem principal falhar', async () => {
    render(
      <OptimizedImage 
        src="https://example.com/invalid-image.jpg" 
        fallbackSrc="https://example.com/fallback.jpg"
        alt="Imagem de teste"
        lazy={false}
      />
    );
    
    const img = screen.getByRole('img');
    fireEvent.error(img);
    
    await waitFor(() => {
      expect(img.getAttribute('src')).toContain('fallback.jpg');
    });
  });

  it('deve mostrar loading spinner inicialmente', () => {
    render(
      <OptimizedImage 
        src="https://example.com/image.jpg" 
        alt="Imagem de teste"
        lazy={false}
      />
    );
    
    // Loading spinner deve estar presente
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('deve aplicar className corretamente', () => {
    const { container } = render(
      <OptimizedImage 
        src="https://example.com/image.jpg" 
        alt="Imagem de teste"
        className="custom-class"
        lazy={false}
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('OptimizedAvatar', () => {
  it('deve renderizar avatar com tamanho correto', () => {
    const { container } = render(
      <OptimizedAvatar 
        src="https://example.com/avatar.jpg" 
        alt="Avatar de teste"
        size="lg"
        lazy={false}
      />
    );
    
    expect(container.firstChild).toHaveClass('w-16', 'h-16', 'rounded-full');
  });

  it('deve usar tamanho médio por padrão', () => {
    const { container } = render(
      <OptimizedAvatar 
        src="https://example.com/avatar.jpg" 
        alt="Avatar de teste"
        lazy={false}
      />
    );
    
    expect(container.firstChild).toHaveClass('w-12', 'h-12', 'rounded-full');
  });

  it('deve mostrar placeholder circular quando não há imagem', () => {
    render(
      <OptimizedAvatar 
        alt="Avatar de teste"
      />
    );
    
    const placeholder = document.querySelector('.rounded-full.bg-gray-200');
    expect(placeholder).toBeInTheDocument();
  });
});