import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import './App.css';

const App = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState('notebook');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${query}`);
        setProducts(response.data.results);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [query]);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const removeFromCart = (product) => {
    setCart(cart.filter(item => item.id !== product.id));
  };

  console.log(cart)

  return (
    <div className="app-container">
      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar produtos..."
        />
      </div>
      <div className="content">
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <>
            <ProductList products={products} addToCart={addToCart} />
            <Cart cartItems={cart} removeFromCart={removeFromCart} />
          </>
        )}
      </div>
    </div>
  );
};

export default App;
