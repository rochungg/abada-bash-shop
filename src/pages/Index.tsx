import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, User } from "lucide-react";
import { Link } from "react-router-dom";

interface Product {
  id: string;
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

interface Selection {
  [key: string]: boolean;
}

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedMale, setSelectedMale] = useState<Selection>({});
  const [selectedFemale, setSelectedFemale] = useState<Selection>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

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

    setProducts(data || []);
  };

  const getProduct = (day: number, gender: string) => {
    return products.find((p) => p.day === day && p.gender === gender);
  };

  const calculateTotals = () => {
    const maleCount = Object.values(selectedMale).filter(Boolean).length;
    const femaleCount = Object.values(selectedFemale).filter(Boolean).length;

    let maleTotal = 0;
    let femaleTotal = 0;

    // Calculate male total
    Object.entries(selectedMale).forEach(([day, selected]) => {
      if (selected) {
        const product = getProduct(parseInt(day), "M");
        if (product) {
          const bracket = `price_bracket_${maleCount}` as keyof Product;
          maleTotal += Number(product[bracket]);
        }
      }
    });

    // Calculate female total
    Object.entries(selectedFemale).forEach(([day, selected]) => {
      if (selected) {
        const product = getProduct(parseInt(day), "F");
        if (product) {
          const bracket = `price_bracket_${femaleCount}` as keyof Product;
          femaleTotal += Number(product[bracket]);
        }
      }
    });

    return { maleCount, femaleCount, maleTotal, femaleTotal, total: maleTotal + femaleTotal };
  };

  const totals = calculateTotals();

  const handleCheckboxChange = (day: number, gender: string, checked: boolean) => {
    if (gender === "M") {
      setSelectedMale((prev) => ({ ...prev, [day]: checked }));
    } else {
      setSelectedFemale((prev) => ({ ...prev, [day]: checked }));
    }
  };

  const handleCheckout = () => {
    if (totals.total === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Selecione pelo menos um dia para continuar",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Em desenvolvimento",
      description: "Sistema de pagamento em breve!",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Abadás 2025
          </h1>
          <Link to="/admin">
            <Button variant="outline" size="sm">
              <User className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Escolha seus Dias
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Quanto mais você compra, melhor o preço! 🎉
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Masculino */}
          <Card className="p-6 shadow-card hover:shadow-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-masculine/10 flex items-center justify-center">
                <span className="text-2xl">👔</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-masculine">Masculino</h3>
                <p className="text-sm text-muted-foreground">
                  {totals.maleCount} {totals.maleCount === 1 ? "dia" : "dias"} selecionado(s)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((day) => {
                const product = getProduct(day, "M");
                const isAvailable = product && product.stock > 0;

                return (
                  <div
                    key={day}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      selectedMale[day]
                        ? "border-masculine bg-masculine/5"
                        : "border-border hover:border-masculine/50"
                    } ${!isAvailable ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`male-${day}`}
                        checked={selectedMale[day] || false}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(day, "M", checked as boolean)
                        }
                        disabled={!isAvailable}
                      />
                      <label
                        htmlFor={`male-${day}`}
                        className="font-medium cursor-pointer"
                      >
                        Dia {day}
                      </label>
                    </div>
                    {!isAvailable && (
                      <Badge variant="destructive" className="text-xs">
                        Esgotado
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Feminino */}
          <Card className="p-6 shadow-card hover:shadow-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-feminine/10 flex items-center justify-center">
                <span className="text-2xl">👗</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-feminine">Feminino</h3>
                <p className="text-sm text-muted-foreground">
                  {totals.femaleCount} {totals.femaleCount === 1 ? "dia" : "dias"} selecionado(s)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((day) => {
                const product = getProduct(day, "F");
                const isAvailable = product && product.stock > 0;

                return (
                  <div
                    key={day}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      selectedFemale[day]
                        ? "border-feminine bg-feminine/5"
                        : "border-border hover:border-feminine/50"
                    } ${!isAvailable ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`female-${day}`}
                        checked={selectedFemale[day] || false}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(day, "F", checked as boolean)
                        }
                        disabled={!isAvailable}
                      />
                      <label
                        htmlFor={`female-${day}`}
                        className="font-medium cursor-pointer"
                      >
                        Dia {day}
                      </label>
                    </div>
                    {!isAvailable && (
                      <Badge variant="destructive" className="text-xs">
                        Esgotado
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Resumo */}
          <Card className="p-6 shadow-card lg:sticky lg:top-24 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">Resumo</h3>
            </div>

            <div className="space-y-4">
              {totals.maleCount > 0 && (
                <div className="p-4 rounded-lg bg-masculine/5 border border-masculine/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-masculine">Masculino</span>
                    <Badge variant="outline" className="border-masculine text-masculine">
                      {totals.maleCount} {totals.maleCount === 1 ? "abadá" : "abadás"}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-masculine">
                    R$ {totals.maleTotal.toFixed(2)}
                  </p>
                </div>
              )}

              {totals.femaleCount > 0 && (
                <div className="p-4 rounded-lg bg-feminine/5 border border-feminine/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-feminine">Feminino</span>
                    <Badge variant="outline" className="border-feminine text-feminine">
                      {totals.femaleCount} {totals.femaleCount === 1 ? "abadá" : "abadás"}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-feminine">
                    R$ {totals.femaleTotal.toFixed(2)}
                  </p>
                </div>
              )}

              {totals.total > 0 && (
                <>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-3xl font-bold text-primary">
                        R$ {totals.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                  >
                    Finalizar Compra
                  </Button>
                </>
              )}

              {totals.total === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Selecione os dias desejados para ver o preço</p>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
              <p className="text-xs text-center text-muted-foreground">
                💡 Dica: Quanto mais abadás você compra, menor o preço por unidade!
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
