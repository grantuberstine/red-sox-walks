export function WooSoxLogo({ size = 36 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://www.mlbstatic.com/team-logos/533.svg"
      alt="Worcester Red Sox"
      width={size}
      height={size}
      className="shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
