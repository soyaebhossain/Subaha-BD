interface Props {
  amount: number;
  className?: string;
}

export default function Price({ amount, className }: Props) {
  return (
    <span className={className}>
      BDT {amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}
    </span>
  );
}
