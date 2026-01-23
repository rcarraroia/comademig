import React from 'react';

interface TestErrorComponentProps {
  shouldError?: boolean;
}

const TestErrorComponent: React.FC<TestErrorComponentProps> = ({ shouldError = false }) => {
  if (shouldError) {
    throw new Error('Erro de teste para validar ErrorBoundary');
  }

  return (
    <div className="p-4 bg-green-100 border border-green-300 rounded">
      <h3 className="text-green-800 font-semibold">Componente funcionando normalmente</h3>
      <p className="text-green-700">Este componente está renderizando sem erros.</p>
    </div>
  );
};

export default TestErrorComponent;