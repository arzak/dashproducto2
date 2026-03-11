export default function Logo({ size = 24, className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <clipPath id="hexClip">
                <path d="M 28 12 L 72 12 L 95 50 L 72 88 L 28 88 L 5 50 Z" />
            </clipPath>
            <g clipPath="url(#hexClip)">
                <rect x="0" y="0" width="100" height="42" fill="#FFFFFF" />
                <rect x="0" y="42" width="100" height="8" fill="#000000" />
                <rect x="0" y="50" width="100" height="20" fill="#FDDF3E" />
                <rect x="0" y="70" width="100" height="8" fill="#000000" />
                <rect x="0" y="78" width="100" height="22" fill="#D49A00" />
            </g>
            <path d="M 28 12 L 72 12 L 95 50 L 72 88 L 28 88 L 5 50 Z" stroke="#000000" strokeWidth="10" strokeLinejoin="round" />
        </svg>
    );
}
