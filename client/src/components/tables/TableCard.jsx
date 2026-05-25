import './TableCard.css';

import {
  Users,
  Clock3,
  UtensilsCrossed
} from 'lucide-react';

const TableCard = ({
  tableNumber,
  section,
  capacity,
  status,
  runningTime,
  customerName,
  onClick
}) => {

  const getStatusClass = () => {

    switch(status){

      case 'AVAILABLE':
        return 'available';

      case 'OCCUPIED':
        return 'occupied';

      case 'RUNNING':
        return 'running';

      case 'BILLING':
        return 'billing';

      default:
        return 'available';
    }
  };

  return (

    <div
      className={`table-card ${getStatusClass()}`}
      onClick={onClick}
    >

      <div className="table-top">

        <div className="table-number-box">

          <h1>
            T-{tableNumber}
          </h1>

        </div>

        <div className={`table-status ${getStatusClass()}`}>

          {status}

        </div>

      </div>

      <div className="table-body">

        <div className="table-section">

          <UtensilsCrossed size={18} />

          <span>
            {section}
          </span>

        </div>

        <div className="table-capacity">

          <Users size={18} />

          <span>
            {capacity} Seats
          </span>

        </div>

        {
          customerName && (

            <div className="customer-box">

              <p>
                Customer
              </p>

              <h4>
                {customerName}
              </h4>

            </div>

          )
        }

      </div>

      <div className="table-footer">

        <div className="running-time">

          <Clock3 size={18} />

          <span>
            {runningTime || '00:00'}
          </span>

        </div>

        <button className="table-action-btn">

          {
            status === 'AVAILABLE'
            ? 'Take Order'
            : 'View Order'
          }

        </button>

      </div>

    </div>

  );
};

export default TableCard;