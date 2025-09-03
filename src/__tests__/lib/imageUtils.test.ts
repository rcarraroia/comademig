/**
 * Testes unitários para utilitários de imagem
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateImageFile,
  generateUniqueFileName,
  getOptimalImageSize,
  compressImage
} from '@/lib/imageUtils';

// Mock do canvas e contexto
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(),
  toBlob: vi.fn(),
};

const mockContext = {
  drawImage: vi.fn(),
};

Object.defineProperty(document, 'createElement', {
  writable: true,
  value: vi.fn((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return {};
  }),
});

// Mock do Image
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';
  width: number = 1920;
  height: number = 1080;

  set src(value: string) {
    this._src = value;
    // Simular carregamento assíncrono
    setTimeout(() => {
      if (value.includes('invalid')) {
        this.onerror?.();
      } else {
        this.onload?.();
      }
    }, 0);
  }

  get src() {
    return this._src;
  }

  private _src: string = '';
}

Object.defineProperty(global, 'Image', {
  writable: true,
  value: MockImage,
});

// Mock do URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'blob:mock-url'),
});

describe('imageUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvas.getContext.mockReturnValue(mockContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateImageFile', () => {
    it('deve validar arquivo de imagem válido', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = await validateImageFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('deve rejeitar formato não suportado', async () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' });
      
      const result = await validateImageFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Formato não suportado');
    });

    it('deve rejeitar arquivo muito grande', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 }); // 15MB
      
      const result = await validateImageFile(file, { maxSize: 10 });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('deve ter no máximo 10MB');
    });

    it('deve rejeitar imagem com dimensões muito pequenas', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock da imagem com dimensões pequenas
      const OriginalImage = global.Image;
      global.Image = class extends MockImage {
        width = 50;
        height = 50;
      } as any;
      
      const result = await validateImageFile(file, { 
        minWidth: 100, 
        minHeight: 100 
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('deve ter pelo menos 100x100 pixels');
      
      // Restaurar Image original
      global.Image = OriginalImage;
    });

    it('deve rejeitar arquivo de imagem inválido', async () => {
      const file = new File([''], 'invalid.jpg', { type: 'image/jpeg' });
      
      const result = await validateImageFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Arquivo de imagem inválido');
    });
  });

  describe('generateUniqueFileName', () => {
    it('deve gerar nome único com timestamp', () => {
      const originalName = 'test.jpg';
      const fileName = generateUniqueFileName(originalName);
      
      expect(fileName).toMatch(/^\d+_[a-z0-9]+\.jpg$/);
    });

    it('deve incluir prefixo quando fornecido', () => {
      const originalName = 'test.jpg';
      const prefix = 'avatar';
      const fileName = generateUniqueFileName(originalName, prefix);
      
      expect(fileName).toMatch(/^avatar_\d+_[a-z0-9]+\.jpg$/);
    });

    it('deve preservar extensão original', () => {
      const originalName = 'test.png';
      const fileName = generateUniqueFileName(originalName);
      
      expect(fileName).toEndWith('.png');
    });

    it('deve usar jpg como extensão padrão quando não há extensão', () => {
      const originalName = 'test';
      const fileName = generateUniqueFileName(originalName);
      
      expect(fileName).toEndWith('.jpg');
    });
  });

  describe('getOptimalImageSize', () => {
    it('deve retornar configuração para avatar', () => {
      const config = getOptimalImageSize('avatar');
      
      expect(config).toEqual({
        width: 200,
        height: 200,
        quality: 0.9
      });
    });

    it('deve retornar configuração para banner', () => {
      const config = getOptimalImageSize('banner');
      
      expect(config).toEqual({
        width: 1200,
        height: 400,
        quality: 0.8
      });
    });

    it('deve retornar configuração para thumbnail', () => {
      const config = getOptimalImageSize('thumbnail');
      
      expect(config).toEqual({
        width: 300,
        height: 200,
        quality: 0.7
      });
    });

    it('deve retornar configuração para imagem completa', () => {
      const config = getOptimalImageSize('full');
      
      expect(config).toEqual({
        width: 1920,
        height: 1080,
        quality: 0.8
      });
    });
  });

  describe('compressImage', () => {
    it('deve comprimir imagem com sucesso', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockBlob = new Blob(['compressed'], { type: 'image/jpeg' });
      
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(mockBlob);
      });

      const result = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.8
      });
      
      expect(result).toBeInstanceOf(File);
      expect(result.type).toBe('image/jpeg');
      expect(mockContext.drawImage).toHaveBeenCalled();
    });

    it('deve redimensionar imagem mantendo aspect ratio', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockBlob = new Blob(['compressed'], { type: 'image/jpeg' });
      
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(mockBlob);
      });

      // Mock da imagem com dimensões específicas
      const OriginalImage = global.Image;
      global.Image = class extends MockImage {
        width = 2000;
        height = 1000;
      } as any;

      await compressImage(file, {
        maxWidth: 800,
        maxHeight: 600
      });
      
      // Verificar se o canvas foi configurado com dimensões corretas
      expect(mockCanvas.width).toBe(800);
      expect(mockCanvas.height).toBe(400); // Mantém aspect ratio
      
      // Restaurar Image original
      global.Image = OriginalImage;
    });

    it('deve lidar com erro na compressão', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(null); // Simular falha
      });

      await expect(compressImage(file)).rejects.toThrow('Falha na compressão da imagem');
    });

    it('deve lidar com erro no carregamento da imagem', async () => {
      const file = new File([''], 'invalid.jpg', { type: 'image/jpeg' });
      
      await expect(compressImage(file)).rejects.toThrow('Falha ao carregar imagem para compressão');
    });
  });
});