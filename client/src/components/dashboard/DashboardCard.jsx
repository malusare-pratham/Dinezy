import './DashboardCard.css';
import {
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const DashboardCard = ({
  title,
  value,
  icon,
  growth,
  growthType,
  subtitle
}) => {

  return (

    <div className="dashboard-card">

      <div className="dashboard-card-top">

        <div className="dashboard-card-icon">
          {icon}
        </div>

        <div
          className={
            growthType === 'up'
              ? 'growth-box positive'
              : 'growth-box negative'
          }
        >

          {
            growthType === 'up'
              ? <TrendingUp size={16} />
              : <TrendingDown size={16} />
          }

          <span>
            {growth}
          </span>

        </div>

      </div>

      <div className="dashboard-card-body">

        <h3 className="dashboard-card-title">
          {title}
        </h3>

        <h1 className="dashboard-card-value">
          {value}
        </h1>

        <p className="dashboard-card-subtitle">
          {subtitle}
        </p>

      </div>

      <div className="dashboard-card-bottom">

        <div className="progress-bar">

          <div
            className="progress-fill"
            style={{
              width: `${growth}%`
            }}
          ></div>

        </div>

      </div>

    </div>

  );
};

export default DashboardCard;