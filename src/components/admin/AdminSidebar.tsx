import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Users, 
  CreditCard, 
  Settings, 
  FileText, 
  BarChart3, 
  UserCheck, 
  DollarSign,
  MessageSquare,
  Activity,
  Building,
  HelpCircle,
  Bell,
  ChevronDown,
  ChevronRight,
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MenuItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  description?: string
  requiredRole?: string[]
}

interface MenuSection {
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: MenuItem[]
  requiredRole?: string[]
  defaultOpen?: boolean
}

export default function AdminSidebar() {
  const location = useLocation()
  const { user, profile } = useAuth()
  const [openSections, setOpenSections] = React.useState<string[]>(['users', 'financial'])

  // Verificar se o usuário tem permissão para acessar uma seção/item
  const hasPermission = (requiredRole?: string[]) => {
    if (!requiredRole || requiredRole.length === 0) return true
    if (!profile?.role) return false
    return requiredRole.includes(profile.role)
  }

  // Definir estrutura do menu - APENAS ROTAS FUNCIONAIS
  const menuSections: MenuSection[] = [
    {
      title: 'Gestão de Usuários',
      icon: Users,
      defaultOpen: true,
      items: [
        {
          title: 'Usuários',
          href: '/admin/users',
          icon: Users,
          description: 'Gerenciar usuários do sistema'
        },
        {
          title: 'Gestão de Cargos e Planos',
          href: '/admin/member-management',
          icon: UserCheck,
          description: 'Gerenciar tipos de membro e planos'
        }
      ]
    },
    {
      title: 'Financeiro',
      icon: DollarSign,
      defaultOpen: true,
      items: [
        {
          title: 'Dashboard Financeiro',
          href: '/admin/financial',
          icon: BarChart3,
          description: 'Visão geral das finanças'
        },
        {
          title: 'Planos de Assinatura',
          href: '/admin/subscription-plans',
          icon: CreditCard,
          description: 'Gerenciar planos e preços'
        },
        {
          title: 'Regularização',
          href: '/admin/regularizacao',
          icon: FileText,
          description: 'Solicitações de regularização'
        }
      ]
    },
    {
      title: 'Conteúdo e Serviços',
      icon: FileText,
      items: [
        {
          title: 'Certidões',
          href: '/admin/certidoes',
          icon: FileText,
          description: 'Gerenciar solicitações de certidões'
        },
        {
          title: 'Gerenciar Conteúdo',
          href: '/admin/content',
          icon: Building,
          description: 'Editar conteúdo do site'
        }
      ]
    },
    {
      title: 'Suporte e Comunicação',
      icon: MessageSquare,
      items: [
        {
          title: 'Tickets de Suporte',
          href: '/admin/support',
          icon: HelpCircle,
          description: 'Atender solicitações de suporte'
        },
        {
          title: 'Notificações',
          href: '/admin/notifications',
          icon: MessageSquare,
          description: 'Gerenciar notificações do sistema'
        },
        {
          title: 'Gestão de Notificações',
          href: '/admin/notification-management',
          icon: Bell,
          description: 'Criar e enviar notificações'
        }
      ]
    },
    {
      title: 'Sistema e Auditoria',
      icon: Settings,
      items: [
        {
          title: 'Logs de Auditoria',
          href: '/admin/audit-logs',
          icon: Activity,
          description: 'Histórico de atividades'
        },
        {
          title: 'Diagnóstico do Sistema',
          href: '/admin/diagnostics',
          icon: Settings,
          description: 'Status e diagnóstico do sistema'
        }
      ]
    }
  ]

  const toggleSection = (sectionTitle: string) => {
    setOpenSections(prev => 
      prev.includes(sectionTitle)
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    )
  }

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const isSectionActive = (items: MenuItem[]) => {
    return items.some(item => isActive(item.href))
  }

  // Filtrar seções baseado nas permissões
  const visibleSections = menuSections.filter(section => 
    hasPermission(section.requiredRole) && 
    section.items.some(item => hasPermission(item.requiredRole))
  )

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Painel Administrativo
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {profile?.role === 'super_admin' ? 'Super Administrador' : 'Administrador'}
        </p>
      </div>

      <nav className="p-4 space-y-2">
        {visibleSections.map((section) => {
          const visibleItems = section.items.filter(item => hasPermission(item.requiredRole))
          if (visibleItems.length === 0) return null

          const isOpen = openSections.includes(section.title.toLowerCase().replace(/\s+/g, '-'))
          const sectionActive = isSectionActive(visibleItems)

          return (
            <Collapsible
              key={section.title}
              open={isOpen}
              onOpenChange={() => toggleSection(section.title.toLowerCase().replace(/\s+/g, '-'))}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between p-3 h-auto",
                    sectionActive && "bg-blue-50 text-blue-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="h-5 w-5" />
                    <span className="font-medium">{section.title}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-1 ml-4 mt-1">
                {visibleItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      "hover:bg-gray-100",
                      isActive(item.href)
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-700"
                    )}
                    title={item.description}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge 
                        variant={isActive(item.href) ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </nav>

      {/* Link para Dashboard e Informações do usuário */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-gray-50">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-200"
        >
          <Home className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Voltar ao Dashboard</span>
        </Link>
        <div className="flex items-center gap-3 p-4">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile?.full_name || user?.email}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}