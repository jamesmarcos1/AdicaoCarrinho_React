import React from 'react';
import './ProductList.css';

const ProductList = ({ products, addToCart }) => {
  return (
    <div className="product-list">
      <h2>Lista de Produtos</h2>
      {products.map(product => (
        <div key={product.id} className="product-item">
          <img src={product.thumbnail} alt={product.title} />
          <h3>{product.title}</h3>
          <p>Preço: R${product.price}</p>
          <button onClick={() => addToCart(product)}>Comprar Produto</button>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
