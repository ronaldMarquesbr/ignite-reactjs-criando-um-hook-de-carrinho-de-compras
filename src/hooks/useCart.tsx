import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
  }, [cart])

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const itemStock = await api.get(`stock/${productId}`).then( res => res.data.amount);
      const item = updatedCart.find( it => it.id === productId );

      if(item){
        if (item.amount < itemStock) {
          item.amount += 1;
          setCart([...updatedCart]);
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        api.get(`products/${productId}`).then( res => {
          setCart([...cart, {
            ...res.data,
            amount: 1
          }]);
        });
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const item = cart.find(it => it.id === productId);
      
      if(item){
        const updatedCart = cart.filter(it => it.id !== productId);
        setCart(updatedCart);
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount <= 0){
        return;
      }

      const updatedCart = [...cart];
      const item = updatedCart.find(it => it.id === productId);

      if(item){
      
        const productStock = await api.get(`stock/${productId}`).then(res => res.data.amount);

        if(amount > productStock){
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          item.amount = amount;
          setCart(updatedCart);
        }

      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
