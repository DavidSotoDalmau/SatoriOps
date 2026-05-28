import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-cyan-400/10 text-cyan-200 ring-1 ring-inset ring-cyan-400/20",
      muted: "bg-white/5 text-slate-300 ring-1 ring-inset ring-white/10",
      danger: "bg-red-500/10 text-red-200 ring-1 ring-inset ring-red-400/20",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
