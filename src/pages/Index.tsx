import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, User, Sparkles, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  day: number;
  gender: string;
  name?: string | null;
  description?: string | null;
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
    // Fetch active batch first
    const { data: activeBatch, error: batchError } = await supabase
      .from("batches")
      .select("id")
      .eq("active", true)
      .maybeSingle();

    if (batchError) {
      toast({
        title: "Erro ao carregar lote ativo",
        description: batchError.message,
        variant: "destructive",
      });
      return;
    }

    if (!activeBatch) {
      setProducts([]);
      return;
    }

    // Fetch products from active batch
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("batch_id", activeBatch.id)
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
    let maleTotalWithoutDiscount = 0;
    let femaleTotalWithoutDiscount = 0;

    Object.entries(selectedMale).forEach(([day, selected]) => {
      if (selected) {
        const product = getProduct(parseInt(day), "M");
        if (product) {
          const bracket = `price_bracket_${maleCount}` as keyof Product;
          maleTotal += Number(product[bracket]);
          maleTotalWithoutDiscount += Number(product.price_bracket_1);
        }
      }
    });

    Object.entries(selectedFemale).forEach(([day, selected]) => {
      if (selected) {
        const product = getProduct(parseInt(day), "F");
        if (product) {
          const bracket = `price_bracket_${femaleCount}` as keyof Product;
          femaleTotal += Number(product[bracket]);
          femaleTotalWithoutDiscount += Number(product.price_bracket_1);
        }
      }
    });

    const totalWithoutDiscount = maleTotalWithoutDiscount + femaleTotalWithoutDiscount;
    const total = maleTotal + femaleTotal;
    const savings = totalWithoutDiscount - total;

    return { 
      maleCount, 
      femaleCount, 
      maleTotal, 
      femaleTotal, 
      total,
      totalWithoutDiscount,
      savings
    };
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 pb-24 md:pb-0">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Abadás 2025
          </h1>
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Mobile sticky bottom bar */}
      {totals.total > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t shadow-lg z-20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total da compra</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                R$ {totals.total.toFixed(2)}
              </p>
            </div>
            <Button 
              onClick={handleCheckout} 
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Finalizar
            </Button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6 md:py-10">
        <div className="text-center mb-6 md:mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold">Compre mais, pague menos</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold mb-2 text-foreground">
            Escolha seus Dias
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Selecione os abadás desejados e aproveite nossos descontos progressivos
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Masculino */}
          <Card className="p-5 shadow-card hover:shadow-hover transition-all duration-300 animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👔</span>
                <h3 className="text-xl font-bold text-masculine">Masculino</h3>
              </div>
              {totals.maleCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totals.maleCount} {totals.maleCount === 1 ? "item" : "itens"}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((day) => {
                const product = getProduct(day, "M");
                const isAvailable = product && product.stock > 0;

                return (
                  <div
                    key={day}
                    className={`group rounded-lg border transition-all duration-200 ${
                      selectedMale[day]
                        ? "border-masculine bg-masculine/5"
                        : "border-border hover:border-masculine/30"
                    } ${!isAvailable ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3 p-3">
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
                        className="cursor-pointer flex-1 min-w-0"
                      >
                        <div className="font-semibold text-sm truncate">
                          {product?.name || `Dia ${day}`}
                        </div>
                        {product?.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {product.description}
                          </p>
                        )}
                      </label>
                      {!isAvailable && (
                        <Badge variant="destructive" className="text-xs shrink-0">
                          Esgotado
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Feminino */}
          <Card className="p-5 shadow-card hover:shadow-hover transition-all duration-300 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👗</span>
                <h3 className="text-xl font-bold text-feminine">Feminino</h3>
              </div>
              {totals.femaleCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totals.femaleCount} {totals.femaleCount === 1 ? "item" : "itens"}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((day) => {
                const product = getProduct(day, "F");
                const isAvailable = product && product.stock > 0;

                return (
                  <div
                    key={day}
                    className={`group rounded-lg border transition-all duration-200 ${
                      selectedFemale[day]
                        ? "border-feminine bg-feminine/5"
                        : "border-border hover:border-feminine/30"
                    } ${!isAvailable ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3 p-3">
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
                        className="cursor-pointer flex-1 min-w-0"
                      >
                        <div className="font-semibold text-sm truncate">
                          {product?.name || `Dia ${day}`}
                        </div>
                        {product?.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {product.description}
                          </p>
                        )}
                      </label>
                      {!isAvailable && (
                        <Badge variant="destructive" className="text-xs shrink-0">
                          Esgotado
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Resumo */}
          <Card className="p-5 shadow-card lg:sticky lg:top-24 h-fit animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Carrinho</h3>
            </div>

            {totals.total === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Nenhum item selecionado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Resumo compacto */}
                <div className="space-y-2">
                  {totals.maleCount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {totals.maleCount} Masculino
                      </span>
                      <span className="font-semibold text-masculine">
                        R$ {totals.maleTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {totals.femaleCount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {totals.femaleCount} Feminino
                      </span>
                      <span className="font-semibold text-feminine">
                        R$ {totals.femaleTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  {totals.savings > 0 && (
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                      <span>Economia</span>
                      <span className="text-accent font-medium">- R$ {totals.savings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      R$ {totals.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full hidden md:flex"
                  size="lg"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Finalizar Compra
                </Button>
              </div>
            )}

            <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-start gap-2">
                <TrendingDown className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Desconto progressivo:</strong> Quanto mais abadás do mesmo gênero, menor o preço unitário
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
