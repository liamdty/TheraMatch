type LogoGeminiProps = { size?: number };

export const LogoGemini = ({ size = 16 }: LogoGeminiProps) => {
  const gradientId = "logo-gemini-gradient"; // consider making this unique per instance if needed
  return (
    <svg
      id="Standard_product_icon"
      data-name="Standard product icon"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      version="1.1"
      viewBox="0 0 192 192"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="63.88"
          y1="262.92"
          x2="143.5"
          y2="330.05"
          gradientTransform="translate(0 386) scale(1 -1)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#217bfe" />
          <stop offset=".27" stopColor="#078efb" />
          <stop offset=".78" stopColor="#a190ff" />
          <stop offset="1" stopColor="#bd99fe" />
        </linearGradient>
      </defs>
      <rect
        id="bounding_box"
        data-name="bounding box"
        width="192"
        height="192"
        fill="none"
        strokeWidth={0}
      />
      <g id="art_layer" data-name="art layer">
        <path
          d="M183.65,95.66c-12.07,0-23.22-2.29-33.83-6.79-10.62-4.65-19.98-11-27.83-18.85-7.85-7.85-14.19-17.22-18.85-27.83-4.51-10.61-6.79-21.77-6.79-33.84,0-.19-.15-.35-.35-.35s-.35.16-.35.35c0,12.07-2.36,23.22-7.01,33.84-4.51,10.62-10.78,19.98-18.63,27.83-7.85,7.85-17.22,14.19-27.83,18.85-10.61,4.51-21.77,6.79-33.84,6.79-.19,0-.35.16-.35.35s.16.35.35.35c12.07,0,23.22,2.36,33.84,7.01,10.62,4.51,19.98,10.78,27.83,18.63,7.85,7.85,14.12,17.22,18.63,27.84,4.65,10.61,7.01,21.76,7.01,33.83,0,.19.16.35.35.35s.35-.15.35-.35c0-12.07,2.28-23.22,6.79-33.83,4.65-10.62,10.99-19.98,18.85-27.84,7.85-7.85,17.21-14.12,27.83-18.63,10.61-4.65,21.76-7.01,33.83-7.01.19,0,.35-.15.35-.35s-.16-.35-.35-.35Z"
          fill={`url(#${gradientId})`}
          strokeWidth={0}
        />
      </g>
    </svg>
  );
};