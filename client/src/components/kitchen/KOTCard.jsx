import './KOTCard.css';

import {
  Clock3,
  ChefHat,
  CircleCheckBig,
  CookingPot
} from 'lucide-react';

const KOTCard = ({
  tokenNumber,
  tableNumber,
  captainName,
  items,
  status,
  orderTime,
  section,
  onUpdateStatus
}) => {

  const getStatusClass = () => {

    switch(status){

      case 'RECEIVED':
        return 'received';

      case 'PREPARING':
        return 'preparing';

      case 'READY':
        return 'ready';

      default:
        return 'received';
    }
  };

  return (

    <div className={`kot-card ${getStatusClass()}`}>

      <div className="kot-top">

        <div>

          <h1 className="kot-token">
            #{tokenNumber}
          </h1>

          <p className="kot-section">
            {section}
          </p>

        </div>

        <div className={`kot-status ${getStatusClass()}`}>

          {
            status === 'RECEIVED'
            && <ChefHat size={18} />
          }

          {
            status === 'PREPARING'
            && <CookingPot size={18} />
          }

          {
            status === 'READY'
            && <CircleCheckBig size={18} />
          }

          <span>
            {status}
          </span>

        </div>

      </div>

      <div className="kot-middle">

        <div className="kot-info">

          <div className="kot-info-box">

            <span>
              Table
            </span>

            <h3>
              T-{tableNumber}
            </h3>

          </div>

          <div className="kot-info-box">

            <span>
              Captain
            </span>

            <h3>
              {captainName}
            </h3>

          </div>

        </div>

        <div className="kot-items">

          {
            items?.map((item,index)=>(

              <div
                key={index}
                className="kot-item"
              >

                <p>
                  {item.name}
                </p>

                <span>
                  x{item.quantity}
                </span>

              </div>

            ))
          }

        </div>

      </div>

      <div className="kot-bottom">

        <div className="kot-timer">

          <Clock3 size={18} />

          <span>
            {orderTime}
          </span>

        </div>

        {
          status === 'RECEIVED'
          && (
            <button
              className="kot-btn preparing-btn"
              onClick={onUpdateStatus}
            >
              Start Preparing
            </button>
          )
        }

        {
          status === 'PREPARING'
          && (
            <button
              className="kot-btn ready-btn"
              onClick={onUpdateStatus}
            >
              Ready To Serve
            </button>
          )
        }

      </div>

    </div>

  );
};

export default KOTCard;