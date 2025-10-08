import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useUpdateUser, UpdateUserInput } from '@/hooks/useUpdateUser'
import { AdminProfile } from '@/hooks/useAdminData'
import { validateCPF, validatePhone, validateCEP, ERROR_MESSAGES } from '@/utils/validators'

// Schema de validação (mesmos campos do create)
const userSchema = z.object({
  nome_completo: z.string()
    .min(3, ERROR_MESSAGES.MIN_LENGTH(3))
    .max(100, ERROR_MESSAGES.MAX_LENGTH(100)),
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato XXX.XXX.XXX-XX')
    .refine(validateCPF, ERROR_MESSAGES.CPF_INVALID),
  telefone: z.string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .refine(val => validatePhone(val.replace(/\D/g, '')), ERROR_MESSAGES.PHONE_INVALID),
  igreja: z.string().min(3, ERROR_MESSAGES.MIN_LENGTH(3)),
  cargo: z.string().min(3, ERROR_MESSAGES.MIN_LENGTH(3)),
  tipo_membro: z.enum(['membro', 'pastor', 'moderador', 'admin']),
  status: z.enum(['ativo', 'inativo', 'pendente']),
  rg: z.string().optional(),
  data_nascimento: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2, 'Use a sigla do estado (ex: MG)').optional(),
  cep: z.string()
    .optional()
    .refine(val => !val || validateCEP(val.replace(/\D/g, '')), ERROR_MESSAGES.CEP_INVALID),
  data_ordenacao: z.string().optional(),
})

interface UserEditModalProps {
  isOpen: boolean
  user: AdminProfile | null
  onClose: () => void
  onSuccess?: () => void
}

export default function UserEditModal({ isOpen, user, onClose, onSuccess }: UserEditModalProps) {
  const { mutate: updateUser, isPending } = useUpdateUser()

  const form = useForm<Omit<UpdateUserInput, 'id'>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nome_completo: '',
      cpf: '',
      telefone: '',
      igreja: '',
      cargo: '',
      tipo_membro: 'membro',
      status: 'ativo',
    },
  })

  // Pré-preencher formulário quando usuário muda
  useEffect(() => {
    if (user) {
      form.reset({
        nome_completo: user.nome_completo,
        cpf: user.cpf,
        telefone: user.telefone,
        igreja: user.igreja,
        cargo: user.cargo,
        tipo_membro: user.tipo_membro as any,
        status: user.status as any,
        rg: user.rg || '',
        data_nascimento: user.data_nascimento || '',
        endereco: user.endereco || '',
        cidade: user.cidade || '',
        estado: user.estado || '',
        cep: user.cep || '',
        data_ordenacao: user.data_ordenacao || '',
      })
    }
  }, [user, form])

  const onSubmit = (data: Omit<UpdateUserInput, 'id'>) => {
    if (!user) return

    updateUser(
      { id: user.id, ...data },
      {
        onSuccess: () => {
          onClose()
          onSuccess?.()
        },
      }
    )
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize os dados de {user.nome_completo}. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Dados Básicos</h3>
              
              <FormField
                control={form.control}
                name="nome_completo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_nascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dados Ministeriais */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Dados Ministeriais</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="igreja"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Igreja *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="data_ordenacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Ordenação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Endereço</h3>
              
              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Configurações</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo_membro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Membro *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="membro">Membro</SelectItem>
                          <SelectItem value="pastor">Pastor</SelectItem>
                          <SelectItem value="moderador">Moderador</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
