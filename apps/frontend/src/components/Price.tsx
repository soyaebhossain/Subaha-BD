interface Props {
  amount: number;
  className?: string;
}

export default function Price({ amount, className }: Props) {
  return (
    <span className={className}>
      BDT {Number(amount).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
    </span>
  );
}
