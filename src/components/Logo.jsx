import logo from '../assets/logo.png';

export default function Logo({ size = 24, className = '' }) {
    return (
        <img 
            src={logo} 
            alt="Requerimientos Logo" 
            width={size} 
            height={size} 
            className={className} 
            style={{ objectFit: 'contain' }}
        />
    );
}
