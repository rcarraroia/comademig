/**
 * Testes unitários para componente ContentStatusBadge
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContentStatusBadge from '@/components/admin/ContentStatusBadge';

// Mock do contexto de autenticação
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAdmin: vi.fn(() => true)
  }))
}));

// Mock do cn utility
vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ContentStatusBadge', () => {
  const defaultProps = {
    pageName: 'home',
    pageTitle: 'Página Inicial',
    hasCustomContent: false,
    editorUrl: '/admin/content/home-editor',
    publicUrl: '/',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar badge para conteúdo padrão', () => {
    renderWithRouter(<ContentStatusBadge {...defaultProps} />);
    
    expect(screen.getByText('Padrão')).toBeInTheDocument();
    expect(screen.getByText('Página Inicial')).toBeInTheDocument();
  });

  it('deve renderizar badge para conteúdo personalizado', () => {
    renderWithRouter(
      <ContentStatusBadge 
        {...defaultProps} 
        hasCustomContent={true} 
      />
    );
    
    expect(screen.getByText('Personalizado')).toBeInTheDocument();
  });

  it('deve expandir quando clicado', () => {
    renderWithRouter(<ContentStatusBadge {...defaultProps} />);
    
    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);
    
    expect(screen.getByText('Esta página usa conteúdo padrão')).toBeInTheDocument();
  });

  it('deve mostrar preview do conteúdo quando fornecido', () => {
    renderWithRouter(
      <ContentStatusBadge 
        {...defaultProps} 
        contentPreview="Preview do conteúdo"
      />
    );
    
    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);
    
    expect(screen.getByText('Preview:')).toBeInTheDocument();
    expect(screen.getByText('Preview do conteúdo')).toBeInTheDocument();
  });

  it('deve mostrar data de última atualização quando fornecida', () => {
    const lastUpdated = new Date('2024-01-15T10:30:00Z');
    
    renderWithRouter(
      <ContentStatusBadge 
        {...defaultProps} 
        lastUpdated={lastUpdated}
      />
    );
    
    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);
    
    expect(screen.getByText(/Última atualização:/)).toBeInTheDocument();
  });

  it('deve renderizar em modo compacto', () => {
    renderWithRouter(
      <ContentStatusBadge 
        {...defaultProps} 
        compact={true}
      />
    );
    
    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Padrão')).toBeInTheDocument();
  });

  it('deve ocultar quando não for admin e showOnlyForAdmins for true', () => {
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({
      isAdmin: vi.fn(() => false)
    });

    const { container } = renderWithRouter(
      <ContentStatusBadge 
        {...defaultProps} 
        showOnlyForAdmins={true}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('deve mostrar para não-admin quando showOnlyForAdmins for false', () => {
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({
      isAdmin: vi.fn(() => false)
    });

    renderWithRouter(
      <ContentStatusBadge 
        {...defaultProps} 
        showOnlyForAdmins={false}
      />
    );
    
    expect(screen.getByText('Padrão')).toBeInTheDocument();
  });

  it('deve aplicar posicionamento correto', () => {
    const { container } = renderWithRouter(
      <ContentStatusBadge 
        {...defaultProps} 
        position="top-left"
      />
    );
    
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('top-4', 'left-4');
  });

  it('deve ocultar quando botão X for clicado', () => {
    renderWithRouter(<ContentStatusBadge {...defaultProps} />);
    
    // Expandir primeiro
    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);
    
    // Clicar no X
    const closeButton = screen.getByRole('button', { name: /ocultar/i });
    fireEvent.click(closeButton);
    
    // Badge deve estar oculto
    expect(screen.queryByText('Padrão')).not.toBeInTheDocument();
  });

  it('deve ter link correto para editor', () => {
    renderWithRouter(<ContentStatusBadge {...defaultProps} />);
    
    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);
    
    const editLink = screen.getByRole('link', { name: /editar página/i });
    expect(editLink).toHaveAttribute('href', '/admin/content/home-editor');
  });

  it('deve ter link correto para página pública quando fornecido', () => {
    renderWithRouter(
      <ContentStatusBadge 
        {...defaultProps} 
        publicUrl="/sobre"
      />
    );
    
    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);
    
    const publicLink = screen.getByRole('link', { name: /ver original/i });
    expect(publicLink).toHaveAttribute('href', '/sobre');
    expect(publicLink).toHaveAttribute('target', '_blank');
  });
});