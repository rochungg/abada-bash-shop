import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { ArrowLeft, Save } from "lucide-react";

interface Product {
  id?: string;
  day: number;
  gender: string;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    
    if (session?.user) {
      await fetchProducts();
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
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
            day,
            gender,
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

  const updateProduct = (index: number, field: keyof Product, value: string) => {
    const updated = [...products];
    updated[index] = {
      ...updated[index],
      [field]: field === "gender" ? value : Number(value),
    };
    setProducts(updated);
  };

  const saveProducts = async () => {
    setLoading(true);

    for (const product of products) {
      const { error } = await supabase.from("products").upsert(
        {
          day: product.day,
          gender: product.gender,
          stock: product.stock,
          price_bracket_1: product.price_bracket_1,
          price_bracket_2: product.price_bracket_2,
          price_bracket_3: product.price_bracket_3,
          price_bracket_4: product.price_bracket_4,
          price_bracket_5: product.price_bracket_5,
          price_bracket_6: product.price_bracket_6,
        },
        { onConflict: "day,gender" }
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
    await fetchProducts();
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
            <h1 className="text-2xl font-bold">Admin - Gestão de Produtos</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-end">
          <Button onClick={saveProducts} disabled={loading} size="lg">
            <Save className="mr-2 h-4 w-4" />
            Salvar Todos os Produtos
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {products.map((product, index) => (
            <Card key={`${product.day}-${product.gender}`} className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>{product.gender === "M" ? "👔" : "👗"}</span>
                Dia {product.day} - {product.gender === "M" ? "Masculino" : "Feminino"}
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor={`stock-${index}`}>Estoque</Label>
                  <Input
                    id={`stock-${index}`}
                    type="number"
                    min="0"
                    value={product.stock}
                    onChange={(e) => updateProduct(index, "stock", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((bracket) => (
                    <div key={bracket}>
                      <Label htmlFor={`price-${index}-${bracket}`}>
                        Preço {bracket} {bracket === 1 ? "abadá" : "abadás"}
                      </Label>
                      <Input
                        id={`price-${index}-${bracket}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={product[`price_bracket_${bracket}` as keyof Product]}
                        onChange={(e) =>
                          updateProduct(index, `price_bracket_${bracket}` as keyof Product, e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Admin;
