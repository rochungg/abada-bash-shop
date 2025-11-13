import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { ArrowLeft, Save, Plus, Package, Trash2, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Batch {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

interface Product {
  id?: string;
  batch_id: string | null;
  day: number;
  gender: string;
  name: string | null;
  description: string | null;
  stock: number;
  price_bracket_1: number;
  price_bracket_2: number;
  price_bracket_3: number;
  price_bracket_4: number;
  price_bracket_5: number;
  price_bracket_6: number;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchDescription, setNewBatchDescription] = useState("");
  const [showNewBatch, setShowNewBatch] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    
    if (session?.user) {
      await fetchBatches();
    }
    setLoading(false);
  };

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from("batches")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar lotes",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setBatches(data || []);
    
    // Select active batch if exists
    const activeBatch = data?.find(b => b.active);
    if (activeBatch && !selectedBatch) {
      setSelectedBatch(activeBatch);
      await fetchProducts(activeBatch.id);
    } else if (data && data.length > 0 && !selectedBatch) {
      setSelectedBatch(data[0]);
      await fetchProducts(data[0].id);
    }
  };

  const fetchProducts = async (batchId: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("batch_id", batchId)
      .order("day", { ascending: true });

    if (error) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Initialize all 12 products (6 days x 2 genders)
    const allProducts: Product[] = [];
    for (let day = 1; day <= 6; day++) {
      for (const gender of ["M", "F"]) {
        const existing = data?.find((p) => p.day === day && p.gender === gender);
        allProducts.push(
          existing || {
            batch_id: batchId,
            day,
            gender,
            name: null,
            description: null,
            stock: 0,
            price_bracket_1: 0,
            price_bracket_2: 0,
            price_bracket_3: 0,
            price_bracket_4: 0,
            price_bracket_5: 0,
            price_bracket_6: 0,
          }
        );
      }
    }

    setProducts(allProducts);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    await checkUser();
    toast({
      title: "Login realizado com sucesso!",
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });

    if (error) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Conta criada com sucesso!",
      description: "Faça login para continuar",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast({
      title: "Logout realizado",
    });
  };

  const createBatch = async () => {
    if (!newBatchName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o lote",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("batches")
      .insert({
        name: newBatchName,
        description: newBatchDescription || null,
        active: false,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao criar lote",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Lote criado com sucesso!",
    });

    setNewBatchName("");
    setNewBatchDescription("");
    setShowNewBatch(false);
    await fetchBatches();
    setSelectedBatch(data);
    await fetchProducts(data.id);
  };

  const toggleBatchActive = async (batchId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("batches")
      .update({ active: !currentActive })
      .eq("id", batchId);

    if (error) {
      toast({
        title: "Erro ao atualizar lote",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: currentActive ? "Lote desativado" : "Lote ativado",
      description: currentActive 
        ? "O lote foi desativado" 
        : "Este lote agora está ativo no e-commerce",
    });

    await fetchBatches();
  };

  const deleteBatch = async (batchId: string) => {
    const { error } = await supabase
      .from("batches")
      .delete()
      .eq("id", batchId);

    if (error) {
      toast({
        title: "Erro ao excluir lote",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Lote excluído com sucesso!",
    });

    if (selectedBatch?.id === batchId) {
      setSelectedBatch(null);
      setProducts([]);
    }

    await fetchBatches();
  };

  const updateProduct = (index: number, field: keyof Product, value: string) => {
    const updated = [...products];
    updated[index] = {
      ...updated[index],
      [field]: field === "gender" || field === "name" || field === "description" ? value : Number(value),
    };
    setProducts(updated);
  };

  const saveProducts = async () => {
    if (!selectedBatch) return;

    setLoading(true);

    for (const product of products) {
      const { error } = await supabase.from("products").upsert(
        {
          batch_id: selectedBatch.id,
          day: product.day,
          gender: product.gender,
          name: product.name || null,
          description: product.description || null,
          stock: product.stock,
          price_bracket_1: product.price_bracket_1,
          price_bracket_2: product.price_bracket_2,
          price_bracket_3: product.price_bracket_3,
          price_bracket_4: product.price_bracket_4,
          price_bracket_5: product.price_bracket_5,
          price_bracket_6: product.price_bracket_6,
        },
        { onConflict: "batch_id,day,gender" }
      );

      if (error) {
        toast({
          title: "Erro ao salvar",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    toast({
      title: "Produtos salvos com sucesso!",
    });
    setLoading(false);
    await fetchProducts(selectedBatch.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin</h1>
            <p className="text-muted-foreground">Área administrativa de abadás</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                Entrar
              </Button>
              <Button type="button" variant="outline" onClick={handleSignup} className="flex-1">
                Criar Conta
              </Button>
            </div>
          </form>

          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para loja
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Admin - Gestão de Lotes</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Lista de Lotes */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Lotes
                </h2>
                <Button
                  size="sm"
                  onClick={() => setShowNewBatch(!showNewBatch)}
                  variant={showNewBatch ? "secondary" : "default"}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {showNewBatch && (
                <div className="mb-4 p-4 border rounded-lg space-y-3">
                  <div>
                    <Label htmlFor="new-batch-name">Nome do Lote</Label>
                    <Input
                      id="new-batch-name"
                      value={newBatchName}
                      onChange={(e) => setNewBatchName(e.target.value)}
                      placeholder="Ex: Carnaval 2025"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-batch-desc">Descrição</Label>
                    <Textarea
                      id="new-batch-desc"
                      value={newBatchDescription}
                      onChange={(e) => setNewBatchDescription(e.target.value)}
                      placeholder="Descrição opcional"
                      rows={2}
                    />
                  </div>
                  <Button onClick={createBatch} size="sm" className="w-full">
                    Criar Lote
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedBatch?.id === batch.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div
                      onClick={() => {
                        setSelectedBatch(batch);
                        fetchProducts(batch.id);
                      }}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold">{batch.name}</div>
                        {batch.active && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent text-accent-foreground">
                            Ativo
                          </span>
                        )}
                      </div>
                      {batch.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {batch.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBatchActive(batch.id, batch.active);
                        }}
                        className="flex-1"
                      >
                        {batch.active ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o lote "{batch.name}"? Todos os produtos associados também serão excluídos. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteBatch(batch.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}

                {batches.length === 0 && !showNewBatch && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum lote cadastrado.<br />Clique em + para criar.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Main Content - Produtos do Lote Selecionado */}
          <div className="lg:col-span-3">
            {selectedBatch ? (
              <>
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedBatch.name}</h2>
                    {selectedBatch.description && (
                      <p className="text-muted-foreground">{selectedBatch.description}</p>
                    )}
                  </div>
                  <Button onClick={saveProducts} disabled={loading} size="lg">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Produtos
                  </Button>
                </div>

                <Tabs defaultValue="1" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    {[1, 2, 3, 4, 5, 6].map((day) => (
                      <TabsTrigger key={day} value={day.toString()}>
                        Dia {day}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {[1, 2, 3, 4, 5, 6].map((day) => (
                    <TabsContent key={day} value={day.toString()} className="space-y-6">
                      {["M", "F"].map((gender) => {
                        const index = products.findIndex(
                          (p) => p.day === day && p.gender === gender
                        );
                        if (index === -1) return null;
                        const product = products[index];

                        return (
                          <Card
                            key={`${day}-${gender}`}
                            className="p-6 border-2 hover:border-primary/30 transition-all"
                          >
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                              <div
                                className={`w-12 h-12 rounded-lg ${
                                  gender === "M"
                                    ? "bg-gradient-to-br from-masculine to-masculine/60"
                                    : "bg-gradient-to-br from-feminine to-feminine/60"
                                } flex items-center justify-center text-2xl`}
                              >
                                {gender === "M" ? "👔" : "👗"}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-bold">
                                  {gender === "M" ? "Masculino" : "Feminino"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Dia {day}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <Label htmlFor={`name-${index}`}>
                                  Nome Personalizado (opcional)
                                </Label>
                                <Input
                                  id={`name-${index}`}
                                  value={product.name || ""}
                                  onChange={(e) =>
                                    updateProduct(index, "name", e.target.value)
                                  }
                                  placeholder={`Dia ${day} - ${gender === "M" ? "Masculino" : "Feminino"}`}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Deixe em branco para usar o nome padrão
                                </p>
                              </div>

                              <div>
                                <Label htmlFor={`description-${index}`}>
                                  Descrição (opcional)
                                </Label>
                                <Textarea
                                  id={`description-${index}`}
                                  value={product.description || ""}
                                  onChange={(e) =>
                                    updateProduct(index, "description", e.target.value)
                                  }
                                  placeholder="Descrição do abadá..."
                                  rows={2}
                                />
                              </div>

                              <div>
                                <Label htmlFor={`stock-${index}`}>Estoque</Label>
                                <Input
                                  id={`stock-${index}`}
                                  type="number"
                                  min="0"
                                  value={product.stock}
                                  onChange={(e) =>
                                    updateProduct(index, "stock", e.target.value)
                                  }
                                />
                              </div>

                              <div>
                                <Label className="mb-3 block">Preços por Quantidade</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {[1, 2, 3, 4, 5, 6].map((bracket) => (
                                    <div
                                      key={bracket}
                                      className="p-3 border rounded-lg bg-muted/30"
                                    >
                                      <Label
                                        htmlFor={`price-${index}-${bracket}`}
                                        className="text-xs font-medium mb-1 block"
                                      >
                                        {bracket} {bracket === 1 ? "abadá" : "abadás"}
                                      </Label>
                                      <div className="flex items-center gap-1">
                                        <span className="text-sm text-muted-foreground">R$</span>
                                        <Input
                                          id={`price-${index}-${bracket}`}
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={
                                            product[
                                              `price_bracket_${bracket}` as keyof Product
                                            ]
                                          }
                                          onChange={(e) =>
                                            updateProduct(
                                              index,
                                              `price_bracket_${bracket}` as keyof Product,
                                              e.target.value
                                            )
                                          }
                                          placeholder="0.00"
                                          className="h-8"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </TabsContent>
                  ))}
                </Tabs>
              </>
            ) : (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Selecione um lote para gerenciar os produtos</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
