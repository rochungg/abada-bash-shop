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
  [key: string]: number; // 0, 1, or 2
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
    // Count different days selected (not total quantity)
    const maleDifferentDays = Object.values(selectedMale).filter(qty => qty > 0).length;
    const femaleDifferentDays = Object.values(selectedFemale).filter(qty => qty > 0).length;
    
    // Count total abadás
    const maleTotalAbadas = Object.values(selectedMale).reduce((sum, qty) => sum + qty, 0);
    const femaleTotalAbadas = Object.values(selectedFemale).reduce((sum, qty) => sum + qty, 0);

    let maleTotal = 0;
    let femaleTotal = 0;
    let maleTotalWithoutDiscount = 0;
    let femaleTotalWithoutDiscount = 0;

    // Calculate male total
    Object.entries(selectedMale).forEach(([day, quantity]) => {
      if (quantity > 0) {
        const product = getProduct(parseInt(day), "M");
        if (product) {
          const bracket = `price_bracket_${maleDifferentDays}` as keyof Product;
          
          if (quantity === 1) {
            // Only one abadá: apply bracket based on different days
            maleTotal += Number(product[bracket]);
            maleTotalWithoutDiscount += Number(product.price_bracket_1);
          } else if (quantity === 2) {
            // Two abadás: first at bracket_1, second at bracket based on different days
            maleTotal += Number(product.price_bracket_1) + Number(product[bracket]);
            maleTotalWithoutDiscount += Number(product.price_bracket_1) * 2;
          }
        }
      }
    });

    // Calculate female total
    Object.entries(selectedFemale).forEach(([day, quantity]) => {
      if (quantity > 0) {
        const product = getProduct(parseInt(day), "F");
        if (product) {
          const bracket = `price_bracket_${femaleDifferentDays}` as keyof Product;
          
          if (quantity === 1) {
            // Only one abadá: apply bracket based on different days
            femaleTotal += Number(product[bracket]);
            femaleTotalWithoutDiscount += Number(product.price_bracket_1);
          } else if (quantity === 2) {
            // Two abadás: first at bracket_1, second at bracket based on different days
            femaleTotal += Number(product.price_bracket_1) + Number(product[bracket]);
            femaleTotalWithoutDiscount += Number(product.price_bracket_1) * 2;
          }
        }
      }
    });

    const totalWithoutDiscount = maleTotalWithoutDiscount + femaleTotalWithoutDiscount;
    const total = maleTotal + femaleTotal;
    const savings = totalWithoutDiscount - total;

    return { 
      maleDifferentDays,
      femaleDifferentDays,
      maleTotalAbadas,
      femaleTotalAbadas,
      maleTotal, 
      femaleTotal, 
      total,
      totalWithoutDiscount,
      savings
    };
  };

  const totals = calculateTotals();

  const handleQuantityChange = (day: number, gender: string, action: "increment" | "decrement") => {
    if (gender === "M") {
      setSelectedMale((prev) => {
        const currentQty = prev[day] || 0;
        let newQty = currentQty;
        
        if (action === "increment" && currentQty < 2) {
          newQty = currentQty + 1;
        } else if (action === "decrement" && currentQty > 0) {
          newQty = currentQty - 1;
        }
        
        return { ...prev, [day]: newQty };
      });
    } else {
      setSelectedFemale((prev) => {
        const currentQty = prev[day] || 0;
        let newQty = currentQty;
        
        if (action === "increment" && currentQty < 2) {
          newQty = currentQty + 1;
        } else if (action === "decrement" && currentQty > 0) {
          newQty = currentQty - 1;
        }
        
        return { ...prev, [day]: newQty };
      });
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
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <header className="border-b bg-card backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-primary">
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total da compra</p>
              <p className="text-2xl font-bold text-primary">
                R$ {totals.total.toFixed(2)}
              </p>
            </div>
            <Button 
              onClick={handleCheckout} 
              size="lg"
              className="shrink-0"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Finalizar
            </Button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Compre mais, pague menos</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
            Escolha seus Dias
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Selecione os abadás desejados e aproveite nossos descontos progressivos
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Masculino */}
          <Card className="p-6 shadow-sm border-border/50 hover:shadow-md transition-all duration-300 animate-fade-in">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-masculine/10 flex items-center justify-center">
                  <span className="text-xl">👔</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Masculino</h3>
              </div>
              {totals.maleTotalAbadas > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totals.maleDifferentDays} {totals.maleDifferentDays === 1 ? "dia" : "dias"} ({totals.maleTotalAbadas} {totals.maleTotalAbadas === 1 ? "abadá" : "abadás"})
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((day) => {
                const product = getProduct(day, "M");
                const isAvailable = product && product.stock > 0;
                const quantity = selectedMale[day] || 0;

                return (
                  <div
                    key={day}
                    className={`group rounded-lg border transition-all duration-200 ${
                      quantity > 0
                        ? "border-masculine bg-masculine/5 shadow-sm"
                        : "border-border/50 hover:border-masculine/40 hover:bg-muted/30"
                    } ${!isAvailable ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <div className="font-semibold text-sm">
                          {product?.name || `Dia ${day}`}
                        </div>
                        {product?.description && (
                          <p className="text-xs text-muted-foreground">
                            {product.description}
                          </p>
                        )}
                        {!isAvailable && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Esgotado
                          </Badge>
                        )}
                      </div>
                      {isAvailable && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-masculine">
                            R$ {product.price_bracket_1.toFixed(2)}
                          </span>
                          <div className="flex items-center gap-1 border rounded-md">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-masculine/10"
                              onClick={() => handleQuantityChange(day, "M", "decrement")}
                              disabled={quantity === 0}
                            >
                              -
                            </Button>
                            <span className="w-6 text-center font-medium">{quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-masculine/10"
                              onClick={() => handleQuantityChange(day, "M", "increment")}
                              disabled={quantity === 2}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Feminino */}
          <Card className="p-6 shadow-sm border-border/50 hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-feminine/10 flex items-center justify-center">
                  <span className="text-xl">👗</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Feminino</h3>
              </div>
              {totals.femaleTotalAbadas > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totals.femaleDifferentDays} {totals.femaleDifferentDays === 1 ? "dia" : "dias"} ({totals.femaleTotalAbadas} {totals.femaleTotalAbadas === 1 ? "abadá" : "abadás"})
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((day) => {
                const product = getProduct(day, "F");
                const isAvailable = product && product.stock > 0;
                const quantity = selectedFemale[day] || 0;

                return (
                  <div
                    key={day}
                    className={`group rounded-lg border transition-all duration-200 ${
                      quantity > 0
                        ? "border-feminine bg-feminine/5 shadow-sm"
                        : "border-border/50 hover:border-feminine/40 hover:bg-muted/30"
                    } ${!isAvailable ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <div className="font-semibold text-sm">
                          {product?.name || `Dia ${day}`}
                        </div>
                        {product?.description && (
                          <p className="text-xs text-muted-foreground">
                            {product.description}
                          </p>
                        )}
                        {!isAvailable && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Esgotado
                          </Badge>
                        )}
                      </div>
                      {isAvailable && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-feminine">
                            R$ {product.price_bracket_1.toFixed(2)}
                          </span>
                          <div className="flex items-center gap-1 border rounded-md">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-feminine/10"
                              onClick={() => handleQuantityChange(day, "F", "decrement")}
                              disabled={quantity === 0}
                            >
                              -
                            </Button>
                            <span className="w-6 text-center font-medium">{quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-feminine/10"
                              onClick={() => handleQuantityChange(day, "F", "increment")}
                              disabled={quantity === 2}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Resumo */}
          <Card className="p-6 shadow-sm border-border/50 lg:sticky lg:top-24 h-fit animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border/50">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Seu Carrinho</h3>
            </div>

            {totals.total === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhum item selecionado</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Resumo compacto */}
                <div className="space-y-3">
                  {totals.maleTotalAbadas > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {totals.maleDifferentDays} {totals.maleDifferentDays === 1 ? 'dia' : 'dias'} masculino ({totals.maleTotalAbadas} {totals.maleTotalAbadas === 1 ? 'abadá' : 'abadás'})
                      </span>
                      <span className="font-semibold text-foreground">
                        R$ {totals.maleTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {totals.femaleTotalAbadas > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {totals.femaleDifferentDays} {totals.femaleDifferentDays === 1 ? 'dia' : 'dias'} feminino ({totals.femaleTotalAbadas} {totals.femaleTotalAbadas === 1 ? 'abadá' : 'abadás'})
                      </span>
                      <span className="font-semibold text-foreground">
                        R$ {totals.femaleTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-border/50 pt-4 space-y-2">
                  {totals.savings > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Economia</span>
                      <span className="text-green-600 font-medium">- R$ {totals.savings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-foreground">Total</span>
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

            <div className="mt-5 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground font-medium">Desconto progressivo:</strong> Quanto mais abadás do mesmo gênero você comprar, menor será o preço unitário
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
