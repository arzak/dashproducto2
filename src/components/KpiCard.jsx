import './KpiCard.css';

export default function KpiCard({ label, value, trend, trendDirection, subtitle, icon: Icon, iconBg }) {
    return (
        <div className="kpi-card animate-fade-in">
            <div className="kpi-card__header">
                <span className="kpi-card__label">{label}</span>
                {Icon && (
                    <div className="kpi-card__icon" style={{ 
                        background: iconBg || 'var(--color-primary-light)',
                        color: iconBg ? 'white' : 'var(--color-primary-content)',
                        boxShadow: iconBg ? `0 4px 12px ${iconBg}40` : 'none'
                    }}>
                        <Icon size={20} strokeWidth={2.5} />
                    </div>
                )}
            </div>
            <div className="kpi-card__body">
                <span className="kpi-card__value">{value}</span>
                {trend && (
                    <span className={`kpi-card__trend kpi-card__trend--${trendDirection || 'up'}`}>
                        {trend}
                    </span>
                )}
            </div>
            {subtitle && <span className="kpi-card__subtitle">{subtitle}</span>}
        </div>
    );
}
