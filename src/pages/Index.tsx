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

  const getSelectedProducts = () => {
    const selected: Array<{ product: Product; gender: string }> = [];
    
    Object.entries(selectedMale).forEach(([day, isSelected]) => {
      if (isSelected) {
        const product = getProduct(parseInt(day), "M");
        if (product) selected.push({ product, gender: "M" });
      }
    });
    
    Object.entries(selectedFemale).forEach(([day, isSelected]) => {
      if (isSelected) {
        const product = getProduct(parseInt(day), "F");
        if (product) selected.push({ product, gender: "F" });
      }
    });
    
    return selected;
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
  const selectedProducts = getSelectedProducts();

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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/5 pb-24 md:pb-0">
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

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold">Compre mais, pague menos!</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Escolha seus Dias
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Selecione os abadás que deseja e aproveite nossos descontos progressivos 🎉
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Masculino */}
          <Card className="p-6 shadow-card hover:shadow-hover transition-all duration-300 animate-fade-in">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-masculine to-masculine/60 flex items-center justify-center shadow-md">
                <span className="text-3xl">👔</span>
              </div>
              <div className="flex-1">
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
                    className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                      selectedMale[day]
                        ? "border-masculine bg-masculine/5 shadow-md scale-[1.02]"
                        : "border-border hover:border-masculine/50 hover:bg-masculine/5"
                    } ${!isAvailable ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between p-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          id={`male-${day}`}
                          checked={selectedMale[day] || false}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(day, "M", checked as boolean)
                          }
                          disabled={!isAvailable}
                          className="mt-1"
                        />
                        <label
                          htmlFor={`male-${day}`}
                          className="cursor-pointer flex-1"
                        >
                          <div className="font-bold text-lg mb-1">
                            {product?.name || `Dia ${day} - Masculino`}
                          </div>
                          {product?.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </label>
                      </div>
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
          <Card className="p-6 shadow-card hover:shadow-hover transition-all duration-300 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-feminine to-feminine/60 flex items-center justify-center shadow-md">
                <span className="text-3xl">👗</span>
              </div>
              <div className="flex-1">
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
                    className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                      selectedFemale[day]
                        ? "border-feminine bg-feminine/5 shadow-md scale-[1.02]"
                        : "border-border hover:border-feminine/50 hover:bg-feminine/5"
                    } ${!isAvailable ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between p-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          id={`female-${day}`}
                          checked={selectedFemale[day] || false}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(day, "F", checked as boolean)
                          }
                          disabled={!isAvailable}
                          className="mt-1"
                        />
                        <label
                          htmlFor={`female-${day}`}
                          className="cursor-pointer flex-1"
                        >
                          <div className="font-bold text-lg mb-1">
                            {product?.name || `Dia ${day} - Feminino`}
                          </div>
                          {product?.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </label>
                      </div>
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
          <Card className="p-6 shadow-card lg:sticky lg:top-24 h-fit animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">Seu Carrinho</h3>
                <p className="text-sm text-muted-foreground">Resumo da compra</p>
              </div>
            </div>

            <div className="space-y-4">
              {totals.total === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Selecione os dias desejados<br />para ver o preço
                  </p>
                </div>
              ) : (
                <>
                  {/* Lista de produtos selecionados */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Itens Selecionados</h4>
                    {selectedProducts.map(({ product, gender }) => (
                      <div 
                        key={product.id} 
                        className={`flex justify-between items-center p-3 rounded-lg text-sm transition-colors ${
                          gender === "M" 
                            ? "bg-masculine/5 border border-masculine/20" 
                            : "bg-feminine/5 border border-feminine/20"
                        }`}
                      >
                        <span className={`flex-1 font-medium ${gender === "M" ? "text-masculine" : "text-feminine"}`}>
                          {product.name || `Dia ${product.day} - ${gender === "M" ? "Masculino" : "Feminino"}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totais por gênero */}
                  <div className="space-y-3 pt-3 border-t">
                    {totals.maleCount > 0 && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-masculine/5 to-masculine/10 border border-masculine/20 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-masculine">Masculino</span>
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
                      <div className="p-4 rounded-xl bg-gradient-to-br from-feminine/5 to-feminine/10 border border-feminine/20 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-feminine">Feminino</span>
                          <Badge variant="outline" className="border-feminine text-feminine">
                            {totals.femaleCount} {totals.femaleCount === 1 ? "abadá" : "abadás"}
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold text-feminine">
                          R$ {totals.femaleTotal.toFixed(2)}
                        </p>
                      </div>
                    )}
                   </div>

                  {/* Total e economia */}
                  <div className="border-t pt-4 space-y-4">
                    {totals.savings > 0 && (
                      <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-muted-foreground">Preço sem desconto:</span>
                          <span className="text-muted-foreground line-through">
                            R$ {totals.totalWithoutDiscount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-accent">Você economiza:</span>
                          <span className="font-bold text-accent">
                            R$ {totals.savings.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        R$ {totals.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    size="lg"
                    className="w-full h-14 text-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-lg hidden md:flex"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Finalizar Compra
                  </Button>
                </>
              )}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20">
              <div className="flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground font-medium">
                  <strong>Desconto progressivo:</strong> Quanto mais abadás você compra do mesmo gênero, menor o preço unitário!
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
