import './PosItem.css';

import {
  Plus,
  Flame
} from 'lucide-react';

const PosItem = ({
  itemName,
  price,
  category,
  image,
  isVeg,
  onAdd
}) => {

  return (

    <div className="pos-item-card">

      <div className="pos-item-image-box">

        <img
          src={image}
          alt="food"
          className="pos-item-image"
        />

        <div
          className={
            isVeg
            ? 'food-type veg'
            : 'food-type nonveg'
          }
        >
          <Flame size={14} />
        </div>

      </div>

      <div className="pos-item-content">

        <div className="pos-item-top">

          <div>

            <h3 className="pos-item-name">
              {itemName}
            </h3>

            <p className="pos-item-category">
              {category}
            </p>

          </div>

          <h2 className="pos-item-price">
            ₹{price}
          </h2>

        </div>

        <button
          className="add-item-btn"
          onClick={onAdd}
        >

          <Plus size={18} />

          Add Item

        </button>

      </div>

    </div>

  );
};

export default PosItem;