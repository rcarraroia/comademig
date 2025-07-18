
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

const Filiacao = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    cpf: "",
    rg: "",
    orgaoExpedidor: "",
    dataNascimento: "",
    sexo: "",
    estadoCivil: "",
    naturalidade: "",
    nacionalidade: "Brasileira",
    profissao: "",
    escolaridade: "",
    telefone: "",
    celular: "",
    email: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    nomeConjuge: "",
    telefoneConjuge: "",
    nomeIgreja: "",
    enderecoIgreja: "",
    cidadeIgreja: "",
    estadoIgreja: "",
    telefoneIgreja: "",
    nomePastor: "",
    cargoMinisterial: "",
    dataConversao: "",
    dataBatismo: "",
    localBatismo: "",
    dataOrdenacao: "",
    localOrdenacao: "",
    tempoMinisterio: "",
    declaracao: false
  });

  const cargosMinisteriais = {
    masculino: {
      Pastor: "Pastor",
      Presbitero: "Presbítero", 
      Diacono: "Diácono",
      Missionario: "Missionário"
    },
    feminino: {
      Pastor: "Pastora",
      Presbitero: "Presbítera",
      Diacono: "Diaconisa", 
      Missionario: "Missionária"
    }
  };

  const getTaxaPorCargo = (cargo: string) => {
    const taxas = {
      Pastor: 250.00,
      Presbitero: 150.00,
      Diacono: 100.00,
      Missionario: 200.00
    };
    return taxas[cargo as keyof typeof taxas] || 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.declaracao) {
      alert("Por favor, aceite a declaração de veracidade das informações.");
      return;
    }

    const taxa = getTaxaPorCargo(formData.cargoMinisterial);
    const cargoDisplay = formData.sexo === "masculino" 
      ? cargosMinisteriais.masculino[formData.cargoMinisterial as keyof typeof cargosMinisteriais.masculino]
      : cargosMinisteriais.feminino[formData.cargoMinisterial as keyof typeof cargosMinisteriais.feminino];

    // Navegar para checkout com dados do formulário
    navigate("/checkout", { 
      state: { 
        formData,
        taxa,
        cargoDisplay
      } 
    });
  };

  const getCargosOptions = () => {
    if (!formData.sexo) return [];
    
    const cargos = formData.sexo === "masculino" ? cargosMinisteriais.masculino : cargosMinisteriais.feminino;
    return Object.entries(cargos).map(([key, label]) => ({ key, label }));
  };

  return (
    <div className="min-h-screen bg-comademig-light py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-comademig-blue mb-4">
              Ficha de Filiação - COMADEMIG
            </h1>
            <p className="text-gray-600">
              Preencha todos os campos para solicitar sua filiação à Convenção
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-comademig-blue">Dados Pessoais</CardTitle>
              <CardDescription>Informações básicas do solicitante</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados Pessoais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                    <Input
                      id="nomeCompleto"
                      value={formData.nomeCompleto}
                      onChange={(e) => handleInputChange("nomeCompleto", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange("cpf", e.target.value)}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rg">RG *</Label>
                    <Input
                      id="rg"
                      value={formData.rg}
                      onChange={(e) => handleInputChange("rg", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgaoExpedidor">Órgão Expedidor *</Label>
                    <Input
                      id="orgaoExpedidor"
                      value={formData.orgaoExpedidor}
                      onChange={(e) => handleInputChange("orgaoExpedidor", e.target.value)}
                      placeholder="Ex: SSP/MG"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={formData.dataNascimento}
                      onChange={(e) => handleInputChange("dataNascimento", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Sexo *</Label>
                    <RadioGroup
                      value={formData.sexo}
                      onValueChange={(value) => handleInputChange("sexo", value)}
                      className="flex flex-row space-x-6 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="masculino" id="masculino" />
                        <Label htmlFor="masculino">Masculino</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="feminino" id="feminino" />
                        <Label htmlFor="feminino">Feminino</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label htmlFor="estadoCivil">Estado Civil *</Label>
                    <Select onValueChange={(value) => handleInputChange("estadoCivil", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                        <SelectItem value="casado">Casado(a)</SelectItem>
                        <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                        <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="naturalidade">Naturalidade *</Label>
                    <Input
                      id="naturalidade"
                      value={formData.naturalidade}
                      onChange={(e) => handleInputChange("naturalidade", e.target.value)}
                      placeholder="Ex: Belo Horizonte/MG"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="profissao">Profissão *</Label>
                    <Input
                      id="profissao"
                      value={formData.profissao}
                      onChange={(e) => handleInputChange("profissao", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="escolaridade">Escolaridade *</Label>
                    <Select onValueChange={(value) => handleInputChange("escolaridade", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fundamental">Ensino Fundamental</SelectItem>
                        <SelectItem value="medio">Ensino Médio</SelectItem>
                        <SelectItem value="superior">Ensino Superior</SelectItem>
                        <SelectItem value="pos">Pós-Graduação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contato */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-comademig-blue mb-4">Contato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => handleInputChange("telefone", e.target.value)}
                        placeholder="(31) 3000-0000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="celular">Celular *</Label>
                      <Input
                        id="celular"
                        value={formData.celular}
                        onChange={(e) => handleInputChange("celular", e.target.value)}
                        placeholder="(31) 99000-0000"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-comademig-blue mb-4">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <Label htmlFor="endereco">Endereço *</Label>
                      <Input
                        id="endereco"
                        value={formData.endereco}
                        onChange={(e) => handleInputChange("endereco", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="numero">Número *</Label>
                      <Input
                        id="numero"
                        value={formData.numero}
                        onChange={(e) => handleInputChange("numero", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        value={formData.complemento}
                        onChange={(e) => handleInputChange("complemento", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bairro">Bairro *</Label>
                      <Input
                        id="bairro"
                        value={formData.bairro}
                        onChange={(e) => handleInputChange("bairro", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cep">CEP *</Label>
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => handleInputChange("cep", e.target.value)}
                        placeholder="00000-000"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cidade">Cidade *</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => handleInputChange("cidade", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="estado">Estado *</Label>
                      <Select onValueChange={(value) => handleInputChange("estado", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MG">MG</SelectItem>
                          <SelectItem value="SP">SP</SelectItem>
                          <SelectItem value="RJ">RJ</SelectItem>
                          <SelectItem value="ES">ES</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Dados do Cônjuge */}
                {formData.estadoCivil === "casado" && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-comademig-blue mb-4">Dados do Cônjuge</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nomeConjuge">Nome Completo do Cônjuge</Label>
                        <Input
                          id="nomeConjuge"
                          value={formData.nomeConjuge}
                          onChange={(e) => handleInputChange("nomeConjuge", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefoneConjuge">Telefone do Cônjuge</Label>
                        <Input
                          id="telefoneConjuge"
                          value={formData.telefoneConjuge}
                          onChange={(e) => handleInputChange("telefoneConjuge", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Dados da Igreja */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-comademig-blue mb-4">Dados da Igreja</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="nomeIgreja">Nome da Igreja *</Label>
                      <Input
                        id="nomeIgreja"
                        value={formData.nomeIgreja}
                        onChange={(e) => handleInputChange("nomeIgreja", e.target.value)}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="enderecoIgreja">Endereço da Igreja *</Label>
                      <Input
                        id="enderecoIgreja"
                        value={formData.enderecoIgreja}
                        onChange={(e) => handleInputChange("enderecoIgreja", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cidadeIgreja">Cidade *</Label>
                      <Input
                        id="cidadeIgreja"
                        value={formData.cidadeIgreja}
                        onChange={(e) => handleInputChange("cidadeIgreja", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="estadoIgreja">Estado *</Label>
                      <Input
                        id="estadoIgreja"
                        value={formData.estadoIgreja}
                        onChange={(e) => handleInputChange("estadoIgreja", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefoneIgreja">Telefone da Igreja</Label>
                      <Input
                        id="telefoneIgreja"
                        value={formData.telefoneIgreja}
                        onChange={(e) => handleInputChange("telefoneIgreja", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nomePastor">Nome do Pastor Presidente *</Label>
                      <Input
                        id="nomePastor"
                        value={formData.nomePastor}
                        onChange={(e) => handleInputChange("nomePastor", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Dados Ministeriais */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-comademig-blue mb-4">Dados Ministeriais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cargoMinisterial">Cargo Ministerial *</Label>
                      <Select 
                        onValueChange={(value) => handleInputChange("cargoMinisterial", value)}
                        disabled={!formData.sexo}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={!formData.sexo ? "Selecione o sexo primeiro" : "Selecione o cargo"} />
                        </SelectTrigger>
                        <SelectContent>
                          {getCargosOptions().map(({ key, label }) => (
                            <SelectItem key={key} value={key}>
                              {label} - R$ {getTaxaPorCargo(key).toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tempoMinisterio">Tempo de Ministério (anos)</Label>
                      <Input
                        id="tempoMinisterio"
                        type="number"
                        value={formData.tempoMinisterio}
                        onChange={(e) => handleInputChange("tempoMinisterio", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataConversao">Data de Conversão</Label>
                      <Input
                        id="dataConversao"
                        type="date"
                        value={formData.dataConversao}
                        onChange={(e) => handleInputChange("dataConversao", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataBatismo">Data do Batismo</Label>
                      <Input
                        id="dataBatismo"
                        type="date"
                        value={formData.dataBatismo}
                        onChange={(e) => handleInputChange("dataBatismo", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="localBatismo">Local do Batismo</Label>
                      <Input
                        id="localBatismo"
                        value={formData.localBatismo}
                        onChange={(e) => handleInputChange("localBatismo", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataOrdenacao">Data da Ordenação</Label>
                      <Input
                        id="dataOrdenacao"
                        type="date"
                        value={formData.dataOrdenacao}
                        onChange={(e) => handleInputChange("dataOrdenacao", e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="localOrdenacao">Local da Ordenação</Label>
                      <Input
                        id="localOrdenacao"
                        value={formData.localOrdenacao}
                        onChange={(e) => handleInputChange("localOrdenacao", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Declaração */}
                <div className="border-t pt-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="declaracao"
                      checked={formData.declaracao}
                      onCheckedChange={(checked) => handleInputChange("declaracao", checked.toString())}
                    />
                    <Label htmlFor="declaracao" className="text-sm">
                      Declaro que todas as informações prestadas são verdadeiras e estou ciente de que informações falsas podem acarretar no cancelamento da filiação.
                    </Label>
                  </div>
                </div>

                {/* Resumo da Taxa */}
                {formData.cargoMinisterial && (
                  <div className="border-t pt-6">
                    <div className="bg-comademig-light p-4 rounded-lg">
                      <h4 className="font-semibold text-comademig-blue mb-2">Resumo da Taxa</h4>
                      <p className="text-gray-700">
                        Cargo: {formData.sexo === "masculino" 
                          ? cargosMinisteriais.masculino[formData.cargoMinisterial as keyof typeof cargosMinisteriais.masculino]
                          : cargosMinisteriais.feminino[formData.cargoMinisterial as keyof typeof cargosMinisteriais.feminino]
                        }
                      </p>
                      <p className="text-lg font-bold text-comademig-blue">
                        Taxa: R$ {getTaxaPorCargo(formData.cargoMinisterial).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-6">
                  <Button type="button" variant="outline" onClick={() => window.history.back()}>
                    Voltar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-comademig-blue hover:bg-comademig-blue/90"
                    disabled={!formData.declaracao || !formData.cargoMinisterial}
                  >
                    Prosseguir para Pagamento
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Filiacao;
