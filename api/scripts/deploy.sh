#!/bin/bash

# Script de deploy para produção
# Sistema de Pagamentos COMADEMIG

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
APP_NAME="comademig-payments-api"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deploy.log"

# Função para logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Função para exibir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
    log "[INFO] $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    log "[SUCCESS] $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    log "[WARNING] $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log "[ERROR] $1"
}

# Função para verificar pré-requisitos
check_prerequisites() {
    print_status "Verificando pré-requisitos..."
    
    # Verificar se Docker está instalado
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado"
        exit 1
    fi
    
    # Verificar se Docker Compose está instalado
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose não está instalado"
        exit 1
    fi
    
    # Verificar se arquivo .env.production existe
    if [ ! -f ".env.production" ]; then
        print_error "Arquivo .env.production não encontrado"
        print_status "Copie .env.example para .env.production e configure as variáveis"
        exit 1
    fi
    
    # Verificar se as variáveis obrigatórias estão configuradas
    source .env.production
    
    required_vars=("ASAAS_API_KEY" "SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "JWT_SECRET")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] || [[ "${!var}" == *"your_"* ]]; then
            print_error "Variável $var não está configurada corretamente"
            exit 1
        fi
    done
    
    print_success "Pré-requisitos verificados"
}

# Função para fazer backup
backup_current() {
    print_status "Fazendo backup da versão atual..."
    
    # Criar diretório de backup se não existir
    mkdir -p "$BACKUP_DIR"
    
    # Nome do backup com timestamp
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    # Fazer backup dos logs
    if [ -d "logs" ]; then
        mkdir -p "$BACKUP_PATH/logs"
        cp -r logs/* "$BACKUP_PATH/logs/" 2>/dev/null || true
    fi
    
    # Fazer backup das configurações
    cp .env.production "$BACKUP_PATH/" 2>/dev/null || true
    cp docker-compose.production.yml "$BACKUP_PATH/" 2>/dev/null || true
    
    # Fazer backup do banco de dados (se aplicável)
    if command -v pg_dump &> /dev/null && [ ! -z "$DATABASE_URL" ]; then
        pg_dump "$DATABASE_URL" > "$BACKUP_PATH/database_backup.sql" 2>/dev/null || true
    fi
    
    print_success "Backup criado em $BACKUP_PATH"
    echo "$BACKUP_PATH" > .last_backup
}

# Função para executar testes
run_tests() {
    print_status "Executando testes..."
    
    # Executar testes unitários
    if npm test; then
        print_success "Testes unitários passaram"
    else
        print_error "Testes unitários falharam"
        exit 1
    fi
    
    # Executar validação de configuração
    if node deploy.js; then
        print_success "Validação de configuração passou"
    else
        print_error "Validação de configuração falhou"
        exit 1
    fi
}

# Função para build da aplicação
build_application() {
    print_status "Fazendo build da aplicação..."
    
    # Build da imagem Docker
    if docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache; then
        print_success "Build da aplicação concluído"
    else
        print_error "Falha no build da aplicação"
        exit 1
    fi
}

# Função para deploy
deploy_application() {
    print_status "Iniciando deploy..."
    
    # Parar serviços atuais (se existirem)
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans || true
    
    # Iniciar novos serviços
    if docker-compose -f "$DOCKER_COMPOSE_FILE" up -d; then
        print_success "Serviços iniciados"
    else
        print_error "Falha ao iniciar serviços"
        rollback
        exit 1
    fi
    
    # Aguardar serviços ficarem prontos
    print_status "Aguardando serviços ficarem prontos..."
    sleep 30
    
    # Verificar health check
    if check_health; then
        print_success "Deploy concluído com sucesso"
    else
        print_error "Health check falhou após deploy"
        rollback
        exit 1
    fi
}

# Função para verificar saúde da aplicação
check_health() {
    print_status "Verificando saúde da aplicação..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            print_success "Aplicação está saudável"
            return 0
        fi
        
        print_status "Tentativa $attempt/$max_attempts - Aguardando aplicação..."
        sleep 10
        ((attempt++))
    done
    
    print_error "Aplicação não respondeu ao health check"
    return 1
}

# Função para rollback
rollback() {
    print_warning "Iniciando rollback..."
    
    if [ -f ".last_backup" ]; then
        BACKUP_PATH=$(cat .last_backup)
        
        if [ -d "$BACKUP_PATH" ]; then
            print_status "Restaurando backup de $BACKUP_PATH"
            
            # Parar serviços atuais
            docker-compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans || true
            
            # Restaurar configurações
            cp "$BACKUP_PATH/.env.production" . 2>/dev/null || true
            cp "$BACKUP_PATH/docker-compose.production.yml" . 2>/dev/null || true
            
            # Restaurar logs
            if [ -d "$BACKUP_PATH/logs" ]; then
                cp -r "$BACKUP_PATH/logs/*" logs/ 2>/dev/null || true
            fi
            
            # Reiniciar serviços
            docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
            
            print_success "Rollback concluído"
        else
            print_error "Backup não encontrado para rollback"
        fi
    else
        print_error "Nenhum backup disponível para rollback"
    fi
}

# Função para limpeza
cleanup() {
    print_status "Executando limpeza..."
    
    # Remover imagens Docker não utilizadas
    docker image prune -f > /dev/null 2>&1 || true
    
    # Remover volumes não utilizados
    docker volume prune -f > /dev/null 2>&1 || true
    
    # Manter apenas os 5 backups mais recentes
    if [ -d "$BACKUP_DIR" ]; then
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
        cd ..
    fi
    
    print_success "Limpeza concluída"
}

# Função para exibir status dos serviços
show_status() {
    print_status "Status dos serviços:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    
    print_status "Logs recentes:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=20
}

# Função principal
main() {
    print_status "=== DEPLOY DO SISTEMA DE PAGAMENTOS COMADEMIG ==="
    print_status "Iniciado em $(date)"
    
    # Verificar argumentos
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            backup_current
            run_tests
            build_application
            deploy_application
            cleanup
            show_status
            print_success "Deploy concluído com sucesso!"
            ;;
        "rollback")
            rollback
            ;;
        "status")
            show_status
            ;;
        "health")
            check_health
            ;;
        "backup")
            backup_current
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            echo "Uso: $0 {deploy|rollback|status|health|backup|cleanup}"
            echo ""
            echo "Comandos:"
            echo "  deploy   - Fazer deploy completo (padrão)"
            echo "  rollback - Fazer rollback para versão anterior"
            echo "  status   - Mostrar status dos serviços"
            echo "  health   - Verificar saúde da aplicação"
            echo "  backup   - Fazer backup manual"
            echo "  cleanup  - Limpar recursos não utilizados"
            exit 1
            ;;
    esac
}

# Capturar sinais para limpeza
trap cleanup EXIT

# Executar função principal
main "$@"