import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react';
import { diagnosticService, DiagnosticReport } from '@/utils/diagnostics';

const SystemDiagnostics = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const diagnosticReport = await diagnosticService.runAllTests();
      setReport(diagnosticReport);
    } catch (error) {
      console.error('Erro ao executar diagnósticos:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const reportText = diagnosticService.formatReport(report);
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostico-comademig-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Aviso</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erro</Badge>;
      default:
        return null;
    }
  };

  const getOverallStatus = (overall: string) => {
    switch (overall) {
      case 'healthy':
        return { color: 'text-green-600', text: 'Sistema Saudável', icon: CheckCircle };
      case 'warning':
        return { color: 'text-yellow-600', text: 'Atenção Necessária', icon: AlertTriangle };
      case 'critical':
        return { color: 'text-red-600', text: 'Problemas Críticos', icon: XCircle };
      default:
        return { color: 'text-gray-600', text: 'Desconhecido', icon: XCircle };
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏥 Diagnóstico do Sistema
          </CardTitle>
          <CardDescription>
            Execute testes automatizados para verificar o estado de saúde de todos os componentes do COMADEMIG
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning ? 'Executando Diagnósticos...' : 'Executar Diagnósticos'}
            </Button>
            
            {report && (
              <Button 
                variant="outline" 
                onClick={downloadReport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar Relatório
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Resumo Geral */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(getOverallStatus(report.overall).icon, { 
                  className: `h-5 w-5 ${getOverallStatus(report.overall).color}` 
                })}
                Status Geral: {getOverallStatus(report.overall).text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.summary.total}</div>
                  <div className="text-sm text-gray-600">Total de Testes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{report.summary.success}</div>
                  <div className="text-sm text-gray-600">Sucessos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{report.summary.warning}</div>
                  <div className="text-sm text-gray-600">Avisos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{report.summary.error}</div>
                  <div className="text-sm text-gray-600">Erros</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes dos Testes */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes dos Testes</CardTitle>
              <CardDescription>
                Resultados detalhados de cada componente testado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.results.map((result, index) => (
                  <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{result.component}</h4>
                          {getStatusBadge(result.status)}
                        </div>
                        <p className="text-sm text-gray-600">{result.message}</p>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer">
                              Ver detalhes técnicos
                            </summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(result.timestamp).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recomendações */}
          {(report.summary.error > 0 || report.summary.warning > 0) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Ações Recomendadas:</strong>
                <ul className="mt-2 space-y-1">
                  {report.summary.error > 0 && (
                    <li>• Corrija os erros críticos antes de continuar</li>
                  )}
                  {report.summary.warning > 0 && (
                    <li>• Revise os avisos para melhorar a estabilidade</li>
                  )}
                  <li>• Execute novamente após as correções</li>
                  <li>• Monitore regularmente o sistema</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
};

export default SystemDiagnostics;